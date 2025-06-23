from enum import Enum

class TimeControl(Enum):
    """Chess game time control types - determines communication method"""
    BULLET = "bullet"      # < 3 minutes per side (WebSocket)
    BLITZ = "blitz"        # 3-10 minutes per side (WebSocket)
    RAPID = "rapid"        # 10-60 minutes per side (WebSocket)
    CLASSICAL = "classical" # > 60 minutes per side (WebSocket)
    DAILY = "daily"        # Correspondence games (RabbitMQ)
    
    @classmethod
    def from_time_control(cls, time_control: str) -> "TimeControl":
        """
        Determine time control from time control string
        Examples: "1+0", "5+3", "10+0", "30+20", "90+30", "daily"
        """
        if time_control.lower() == "daily":
            return cls.DAILY
            
        # Parse time control format "minutes+increment"
        try:
            base_time = int(time_control.split('+')[0])
            if base_time < 3:
                return cls.BULLET
            elif base_time <= 10:
                return cls.BLITZ
            elif base_time <= 60:
                return cls.RAPID
            else:
                return cls.CLASSICAL
        except (ValueError, IndexError):
            return cls.RAPID
    
    @property
    def is_realtime(self) -> bool:
        """Returns True for real-time games (WebSocket), False for async games (RabbitMQ)"""
        return self != TimeControl.DAILY

class GameStatus(Enum):
    """Game status enumeration"""
    WAITING = "waiting"          # Waiting for second player
    IN_PROGRESS = "in_progress"  # Game in progress  
    FINISHED = "finished"        # Game finished
    ABANDONED = "abandoned"      # Game abandoned by players
