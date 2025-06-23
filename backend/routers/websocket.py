"""
WebSocket Router - Real-time game communication

Handles WebSocket connections for:
- Real-time move updates
- Game state synchronization
- Player presence
- RabbitMQ fallback when players are offline
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
import json

from services.game_service import game_service

router = APIRouter()

# Store active WebSocket connections per game
game_connections: Dict[str, Set[WebSocket]] = {}

# Store user connections per game: {game_id: {username: websocket}}
user_connections: Dict[str, Dict[str, WebSocket]] = {}


async def add_connection(game_id: str, websocket: WebSocket, username: str = None):
    """Add a WebSocket connection to a game."""
    if game_id not in game_connections:
        game_connections[game_id] = set()
    game_connections[game_id].add(websocket)
    
    # Track user connections for fallback logic
    if username:
        if game_id not in user_connections:
            user_connections[game_id] = {}
        user_connections[game_id][username] = websocket


async def remove_connection(game_id: str, websocket: WebSocket, username: str = None):
    """Remove a WebSocket connection from a game."""
    if game_id in game_connections:
        game_connections[game_id].discard(websocket)
        if not game_connections[game_id]:
            del game_connections[game_id]
    
    # Remove from user connections
    if username and game_id in user_connections:
        user_connections[game_id].pop(username, None)
        if not user_connections[game_id]:
            del user_connections[game_id]


def is_user_connected(game_id: str, username: str) -> bool:
    """Check if a user is currently connected to a game via WebSocket."""
    if game_id not in user_connections or username not in user_connections[game_id]:
        return False
    
    websocket = user_connections[game_id][username]
    try:
        # Check if WebSocket is still open (1 = OPEN state)
        return websocket.client_state == 1
    except:
        return False


def get_connected_users(game_id: str) -> Set[str]:
    """Get all users currently connected to a game."""
    if game_id not in user_connections:
        return set()
    return set(user_connections[game_id].keys())


async def handle_user_reconnect(game_id: str, username: str, websocket: WebSocket):
    """Handle user reconnection - deliver pending moves from RabbitMQ."""
    try:
        from message_queue.rabbitmq import rabbitmq_manager
        print(f"Handling reconnection for user {username} in game {game_id}")
        await rabbitmq_manager.deliver_pending_moves(game_id, username, websocket)
        print(f"Completed pending move delivery for user {username} in game {game_id}")
    except Exception as e:
        print(f"Failed to deliver pending moves to {username} in game {game_id}: {e}")


async def broadcast_to_game(game_id: str, message: dict, exclude: WebSocket = None):
    """Broadcast a message to all connections in a game."""
    if game_id not in game_connections:
        return
    
    message_str = json.dumps(message)
    connections_to_remove = []
    
    for connection in game_connections[game_id]:
        if connection == exclude:
            continue
        try:
            await connection.send_text(message_str)
        except:
            connections_to_remove.append(connection)
    
    # Remove dead connections
    for connection in connections_to_remove:
        game_connections[game_id].discard(connection)


@router.websocket("/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    """WebSocket endpoint for real-time game communication."""
    await websocket.accept()
    
    # Try to extract username from query parameters or wait for initial message
    username = None
    try:
        # Check query parameters for username
        query_params = dict(websocket.query_params)
        username = query_params.get('username')
        print(f"WebSocket connection for game {game_id}, user: {username or 'anonymous'}")
    except:
        pass
    
    await add_connection(game_id, websocket, username)
    
    # Handle missed moves from RabbitMQ when user reconnects
    if username:
        print(f"User {username} connected to game {game_id}, checking for pending moves...")
        await handle_user_reconnect(game_id, username, websocket)
    
    try:
        # Send current game state to newly connected client
        try:
            game = await game_service.get_game(game_id)
            if game:
                game_state_message = {
                    "type": "game_state",
                    "game_id": game_id,
                    "fen": game.current_fen,
                    "status": game.status.value if hasattr(game.status, 'value') else game.status,
                    "player_white": game.player_white,
                    "player_black": game.player_black,
                    "time_control": game.time_control,
                    "result": game.result
                }
                await websocket.send_text(json.dumps(game_state_message))
                print(f"Sent current game state to {username or 'anonymous'} for game {game_id}")
            else:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Game not found"
                }))
                return
        except Exception as e:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error getting game: {str(e)}"
            }))
            return
        
        # Listen for messages from client (optional - moves typically come via REST API)
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message["type"] == "get_game_state":
                    try:
                        game = await game_service.get_game(game_id)
                        if game:
                            await websocket.send_text(json.dumps({
                                "type": "game_state",
                                "game_id": game_id,
                                "fen": game.current_fen,
                                "status": game.status.value if hasattr(game.status, 'value') else game.status,
                                "player_white": game.player_white,
                                "player_black": game.player_black,
                                "result": game.result
                            }))
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": f"Error getting game state: {str(e)}"
                        }))
                        
            except WebSocketDisconnect:
                break
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error", 
                    "message": f"Error processing message: {str(e)}"
                }))
                    
    except WebSocketDisconnect:
        pass
    finally:
        print(f"WebSocket disconnected for user {username or 'anonymous'} in game {game_id}")
        await remove_connection(game_id, websocket, username)
