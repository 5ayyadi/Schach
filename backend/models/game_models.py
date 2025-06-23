from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from enums.game_enums import TimeControl, GameStatus

class GameCreate(BaseModel):
    """Request model for creating a game"""
    username: str = Field(..., description="Player username")
    time_control: str = Field(..., description="Time control (e.g., '5+3' or 'daily')")

class GameState(BaseModel):
    """Lightweight game state model for MongoDB storage"""
    id: str = Field(..., description="Unique game identifier")
    player_white: str = Field(..., description="White player username")
    player_black: Optional[str] = Field(None, description="Black player username")
    
    # FEN-based game state
    fens: List[str] = Field(default=["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"], 
                           description="List of FEN positions (move history)")
    
    # Game metadata
    time_control: str = Field(..., description="Time control string")
    status: GameStatus = Field(GameStatus.WAITING, description="Current game status")
    result: Optional[str] = Field(None, description="Game result: 'white', 'black', 'draw', or None")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @property
    def current_fen(self) -> str:
        """Get the current board position"""
        return self.fens[-1]
    
    @property
    def time_control_enum(self) -> TimeControl:
        """Get the time control enum"""
        return TimeControl.from_time_control(self.time_control)
    
    @property
    def is_realtime(self) -> bool:
        """Check if this is a real-time game (WebSocket) or correspondence (RabbitMQ)"""
        return self.time_control_enum.is_realtime
    
    model_config = ConfigDict(use_enum_values=True)

class MoveRequest(BaseModel):
    """Request model for making a move"""
    username: str = Field(..., description="Player making the move")
    move: str = Field(..., description="Move in UCI format (e.g., 'e2e4')")

class MoveResponse(BaseModel):
    """Response model for a move"""
    success: bool
    fen: Optional[str] = None
    game_over: bool = False
    result: Optional[str] = None
    error: Optional[str] = None
