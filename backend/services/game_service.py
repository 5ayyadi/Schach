"""
Game Service - Core logic for lightweight chess backend

Handles:
- Game creation and joining
- Move validation using python-chess
- FEN-based state management
- WebSocket vs RabbitMQ routing
"""

import uuid
import random
import string
from typing import List, Optional
from datetime import datetime, timezone

from models.game_models import GameState, MoveResponse
from enums.game_enums import GameStatus, TimeControl
from database.repository import GameRepository
from message_queue.rabbitmq import rabbitmq_manager
from utils.chess_utils import validate_and_apply_move, detect_game_end, get_turn_from_fen


class GameService:
    """Lightweight game service for chess games"""
    
    def __init__(self):
        self.repository = GameRepository()
    
    def _generate_short_id(self) -> str:
        """Generate a short, human-readable game ID (8 characters)"""
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    async def create_game(self, username: str, time_control: str) -> GameState:
        """Create a new chess game"""
        # Generate a short, unique game ID
        game_id = self._generate_short_id()
        
        # Ensure the ID is unique (very unlikely collision, but let's be safe)
        max_attempts = 10
        attempts = 0
        while attempts < max_attempts:
            existing_game = await self.repository.get_game(game_id)
            if not existing_game:
                break
            game_id = self._generate_short_id()
            attempts += 1
        
        game = GameState(
            id=game_id,
            player_white=username,
            time_control=time_control,
            status=GameStatus.WAITING
        )
        
        await self.repository.save_game(game)
        return game
    
    async def join_game(self, game_id: str, username: str) -> GameState:
        """Join an existing game"""
        game = await self.repository.get_game(game_id)
        if not game:
            raise ValueError("Game not found")
        
        if game.status != GameStatus.WAITING and game.status != GameStatus.WAITING.value:
            raise ValueError("Game is not available for joining")
        
        if game.player_white == username:
            raise ValueError("You are already in this game")
        
        if game.player_black:
            raise ValueError("Game is already full")
        
        # Join as black player
        game.player_black = username
        game.status = GameStatus.IN_PROGRESS
        game.updated_at = datetime.now(timezone.utc)
        
        await self.repository.save_game(game)
        
        # Broadcast game joined event
        await self._broadcast_game_joined(game_id, game.player_white, game.player_black)
        
        return game
    
    async def make_move(self, game_id: str, username: str, move_uci: str) -> MoveResponse:
        """Make a move in a game"""
        game = await self.repository.get_game(game_id)
        if not game:
            return MoveResponse(success=False, error="Game not found")
        
        if game.status != GameStatus.IN_PROGRESS and game.status != GameStatus.IN_PROGRESS.value:
            return MoveResponse(success=False, error="Game is not in progress")
        
        # Validate player turn
        current_turn = get_turn_from_fen(game.current_fen)
        if current_turn == "white" and username != game.player_white:
            return MoveResponse(success=False, error="Not your turn (white to move)")
        elif current_turn == "black" and username != game.player_black:
            return MoveResponse(success=False, error="Not your turn (black to move)")
        
        # Validate and apply move
        success, new_fen, error = validate_and_apply_move(game.current_fen, move_uci)
        if not success:
            return MoveResponse(success=False, error=error)
        
        # Update game state
        game.fens.append(new_fen)
        game.updated_at = datetime.now(timezone.utc)
        
        # Check for game end
        game_ended, result = detect_game_end(new_fen)
        if game_ended:
            game.status = GameStatus.FINISHED
            game.result = result
        
        await self.repository.save_game(game)
        
        # Handle real-time vs async communication
        move_response = MoveResponse(
            success=True,
            fen=new_fen,
            game_over=game_ended,
            result=result
        )
        
        # Always try WebSocket first, fallback to RabbitMQ for offline players
        await self._handle_move_delivery(game_id, username, move_uci, new_fen, game_ended, result)
        
        return move_response
    
    async def get_game(self, game_id: str) -> Optional[GameState]:
        """Get a game by ID"""
        return await self.repository.get_game(game_id)
    
    async def list_user_games(self, username: str) -> List[GameState]:
        """Get all games for a user"""
        return await self.repository.get_user_games(username)
    
    async def _broadcast_game_joined(self, game_id: str, player_white: str, player_black: str):
        """Broadcast game joined event via WebSocket"""
        try:
            from routers.websocket import broadcast_to_game
            
            await broadcast_to_game(game_id, {
                "type": "game_joined",
                "game_id": game_id,
                "player_white": player_white,
                "player_black": player_black
            })
                
        except Exception as e:
            # Log error but don't fail the join
            print(f"Failed to broadcast game joined via WebSocket: {e}")

    async def _handle_move_delivery(self, game_id: str, username: str, move_uci: str, fen: str, game_ended: bool, result: str = None):
        """Handle move delivery with WebSocket primary and RabbitMQ fallback"""
        try:
            from routers.websocket import is_user_connected, broadcast_to_game
            
            # Get the game to determine the opponent
            game = await self.repository.get_game(game_id)
            if not game:
                return
            
            # Determine the opponent
            opponent = game.player_black if username == game.player_white else game.player_white
            if not opponent:
                return
            
            # Prepare move message
            move_message = {
                "type": "move_made",
                "game_id": game_id,
                "username": username,
                "move": move_uci,
                "fen": fen,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Always broadcast to all connected users in the game (including observers)
            await broadcast_to_game(game_id, move_message)
            print(f"Move broadcasted via WebSocket to all connected users in game {game_id}")
            
            # Check if the specific opponent is connected
            if not is_user_connected(game_id, opponent):
                # Opponent is offline - use RabbitMQ fallback for reliable delivery
                await self._publish_move_for_offline_player(game_id, opponent, {
                    "game_id": game_id,
                    "username": username,
                    "move": move_uci,
                    "fen": fen,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                print(f"Move queued via RabbitMQ for offline player {opponent}")
            else:
                print(f"Opponent {opponent} is online, move delivered via WebSocket")
                
            # If game ended, also broadcast game ended event
            if game_ended:
                game_end_message = {
                    "type": "game_ended",
                    "game_id": game_id,
                    "result": result,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await broadcast_to_game(game_id, game_end_message)
                
                # Also queue game end message for offline opponent
                if not is_user_connected(game_id, opponent):
                    await self._publish_move_for_offline_player(game_id, opponent, game_end_message)
                
        except Exception as e:
            # Log error but don't fail the move
            print(f"Failed to deliver move: {e}")

    async def _publish_move_for_offline_player(self, game_id: str, recipient_username: str, move_data: dict):
        """Publish move to RabbitMQ for offline player delivery"""
        try:
            await rabbitmq_manager.publish_pending_move(game_id, recipient_username, move_data)
        except Exception as e:
            print(f"Failed to publish move to RabbitMQ for {recipient_username}: {e}")

    async def _broadcast_move_realtime(self, game_id: str, username: str, move_uci: str, fen: str, game_ended: bool, result: str = None):
        """Broadcast move via WebSocket for real-time games"""
        try:
            from routers.websocket import broadcast_to_game
            
            # Broadcast move made event
            await broadcast_to_game(game_id, {
                "type": "move_made",
                "game_id": game_id,
                "username": username,
                "move": move_uci,
                "fen": fen,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            # If game ended, broadcast game ended event
            if game_ended:
                await broadcast_to_game(game_id, {
                    "type": "game_ended",
                    "game_id": game_id,
                    "result": result,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
        except Exception as e:
            # Log error but don't fail the move
            print(f"Failed to broadcast move via WebSocket: {e}")

    async def _publish_move_async(self, game_id: str, username: str, move_uci: str, fen: str):
        """Publish move to RabbitMQ for correspondence games"""
        try:
            await rabbitmq_manager.publish_move_event({
                "game_id": game_id,
                "username": username,
                "move": move_uci,
                "fen": fen,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        except Exception as e:
            # Log error but don't fail the move
            print(f"Failed to publish move to RabbitMQ: {e}")


# Global service instance
game_service = GameService()
