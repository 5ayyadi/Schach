from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from enums.game_enums import MoveType

class MoveMessage(BaseModel):
    """Message format for RabbitMQ move messages"""
    game_id: str
    player_id: str
    move_uci: str
    move_san: Optional[str] = None
    move_type: MoveType = MoveType.NORMAL
    timestamp: datetime
    client_timestamp: Optional[datetime] = None
    time_taken: Optional[int] = None  # Time taken for move in seconds
    
    model_config = ConfigDict(use_enum_values=True)

class GameEventMessage(BaseModel):
    """Message format for game events"""
    game_id: str
    event_type: str  # "player_joined", "game_started", "game_ended", etc.
    player_id: Optional[str] = None
    data: Dict[str, Any] = {}
    timestamp: datetime = datetime.now(timezone.utc)

class NotificationMessage(BaseModel):
    """Message format for player notifications"""
    player_id: str
    game_id: str
    message_type: str  # "move_notification", "game_reminder", etc.
    title: str
    content: str
    timestamp: datetime = datetime.now(timezone.utc)
    data: Dict[str, Any] = {}
