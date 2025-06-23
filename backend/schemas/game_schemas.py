"""
API Schema Models - Request/Response models for REST endpoints

Designed for React frontend with FEN-based communication
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from models.game_models import GameState


class CreateGameRequest(BaseModel):
    """Request to create a new game"""
    time_control: str = Field(..., description="Time control (e.g., '5+3' or 'daily')")


class JoinGameRequest(BaseModel):
    """Request to join a game"""
    pass  # Username will come from authentication


class MakeMoveRequest(BaseModel):
    """Request to make a move"""
    move: str = Field(..., description="Move in UCI format (e.g., 'e2e4')")


class GameResponse(BaseModel):
    """Game state response for API"""
    id: str
    player_white: str
    player_black: Optional[str]
    fen: str  # Current position
    time_control: str
    status: str
    result: Optional[str]
    created_at: str
    updated_at: str
    
    @classmethod
    def from_game_state(cls, game: GameState) -> "GameResponse":
        """Convert GameState to API response"""
        return cls(
            id=game.id,
            player_white=game.player_white,
            player_black=game.player_black,
            fen=game.current_fen,
            time_control=game.time_control,
            status=game.status.value if hasattr(game.status, 'value') else game.status,
            result=game.result,
            created_at=game.created_at.isoformat(),
            updated_at=game.updated_at.isoformat()
        )


class MoveResponse(BaseModel):
    """Response after making a move"""
    success: bool
    fen: Optional[str] = None
    game_over: bool = False
    result: Optional[str] = None
    error: Optional[str] = None


class GameHistoryRequest(BaseModel):
    """Request to get user's game history"""
    username: str = Field(..., description="Player username")


class GameHistoryResponse(BaseModel):
    """User's game history response"""
    games: List[GameResponse]
