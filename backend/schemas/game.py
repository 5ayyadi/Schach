"""
Game Schemas - Pydantic models for API requests and responses

Simple schemas for:
- Creating and joining games
- Making moves
- Game and move responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from models.game_models import Game, Move


class CreateGameRequest(BaseModel):
    """Request to create a new game."""
    player_name: str = Field(..., min_length=1, max_length=50)
    game_type: str = Field(..., description="'websocket' or 'async'")


class JoinGameRequest(BaseModel):
    """Request to join an existing game."""
    player_name: str = Field(..., min_length=1, max_length=50)


class MakeMoveRequest(BaseModel):
    """Request to make a move in a game."""
    player_name: str = Field(..., min_length=1, max_length=50)
    move: str = Field(..., description="Move in UCI format (e.g., 'e2e4')")


class PlayerResponse(BaseModel):
    """Player information in responses."""
    name: str


class MoveResponse(BaseModel):
    """Response containing move information."""
    move_id: str
    game_id: str
    player: str
    from_square: str
    to_square: str
    piece: str
    move_number: int
    timestamp: datetime
    
    @classmethod
    def from_move(cls, move: Move) -> "MoveResponse":
        """Create response from Move model."""
        return cls(
            move_id=str(move.id),
            game_id=move.game_id,
            player=move.player,
            from_square=move.from_square,
            to_square=move.to_square,
            piece=move.piece,
            move_number=move.move_number,
            timestamp=move.timestamp
        )


class GameResponse(BaseModel):
    """Response containing game information."""
    game_id: str
    status: str
    game_type: str
    board_fen: str
    current_player: str
    white_player: Optional[str] = None
    black_player: Optional[str] = None
    winner: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    moves: List[MoveResponse] = []
    
    @classmethod
    def from_game(cls, game: Game) -> "GameResponse":
        """Create response from Game model."""
        return cls(
            game_id=str(game.id),
            status=game.status,
            game_type=game.game_type,
            board_fen=game.board_fen,
            current_player=game.current_player,
            white_player=game.white_player,
            black_player=game.black_player,
            winner=game.winner,
            created_at=game.created_at,
            updated_at=game.updated_at,
            moves=[MoveResponse.from_move(move) for move in game.moves]
        )
