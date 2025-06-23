from typing import List, Optional
from pymongo import MongoClient
from models.game_models import GameState
from core.settings import settings
import logging

logger = logging.getLogger(__name__)

# Global database connection
_client = None
_db = None
_repository_instance = None


def get_repository() -> 'GameRepository':
    """Get singleton repository instance"""
    global _repository_instance
    if _repository_instance is None:
        _repository_instance = GameRepository()
    return _repository_instance


async def init_db():
    """Initialize database connection"""
    global _client, _db
    try:
        _client = MongoClient(settings.MONGODB_URL)
        _db = _client[settings.MONGODB_DB_NAME]
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

class GameRepository:
    """Lightweight repository for game data operations"""
    
    def __init__(self):
        try:
            self.client = MongoClient(settings.MONGODB_URL)
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.games_collection = self.db.games
            self.users_collection = self.db.users  # Add users collection
            
            # Create indexes for efficient queries
            self.games_collection.create_index("status")
            self.games_collection.create_index("player_white")
            self.games_collection.create_index("player_black")
            self.connected = True
            logger.info("Repository connected to MongoDB")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            print("Running in test mode with in-memory storage")
            # Fallback to in-memory storage for testing
            self.connected = False
            self._games = {}
            self._users = {}  # Add users storage
    
    async def save_game(self, game: GameState) -> GameState:
        """Save or update a game in the database"""
        if not self.connected:
            # Use in-memory storage for testing
            self._games[game.id] = game
            return game
            
        try:
            game_dict = {
                "_id": game.id,
                "player_white": game.player_white,
                "player_black": game.player_black,
                "fens": game.fens,
                "time_control": game.time_control,
                "status": game.status.value if hasattr(game.status, 'value') else game.status,
                "result": game.result,
                "created_at": game.created_at,
                "updated_at": game.updated_at
            }
            
            # Upsert (insert or update)
            self.games_collection.replace_one(
                {"_id": game.id}, 
                game_dict, 
                upsert=True
            )
            
            logger.info(f"Game {game.id} saved successfully")
            return game
            
        except Exception as e:
            logger.error(f"Failed to save game {game.id}: {e}")
            raise
    
    async def get_game(self, game_id: str) -> Optional[GameState]:
        """Get a game by ID"""
        if not self.connected:
            # Use in-memory storage for testing
            return self._games.get(game_id)
            
        try:
            game_dict = self.games_collection.find_one({"_id": game_id})
            if not game_dict:
                return None
            
            # Convert MongoDB document to GameState
            return GameState(
                id=game_dict["_id"],
                player_white=game_dict["player_white"],
                player_black=game_dict.get("player_black"),
                fens=game_dict["fens"],
                time_control=game_dict["time_control"],
                status=game_dict["status"],
                result=game_dict.get("result"),
                created_at=game_dict["created_at"],
                updated_at=game_dict["updated_at"]
            )
            
        except Exception as e:
            logger.error(f"Failed to get game {game_id}: {e}")
            return None
    
    async def get_user_games(self, username: str) -> List[GameState]:
        """Get all games for a user"""
        if not self.connected:
            # Use in-memory storage for testing
            games = []
            for game in self._games.values():
                if game.player_white == username or game.player_black == username:
                    games.append(game)
            return sorted(games, key=lambda g: g.updated_at, reverse=True)
            
        try:
            games = []
            cursor = self.games_collection.find({
                "$or": [
                    {"player_white": username},
                    {"player_black": username}
                ]
            }).sort("updated_at", -1)  # Most recent first
            
            for game_dict in cursor:
                games.append(GameState(
                    id=game_dict["_id"],
                    player_white=game_dict["player_white"],
                    player_black=game_dict.get("player_black"),
                    fens=game_dict["fens"],
                    time_control=game_dict["time_control"],
                    status=game_dict["status"],
                    result=game_dict.get("result"),
                    created_at=game_dict["created_at"],
                    updated_at=game_dict["updated_at"]
                ))
            
            return games
            
        except Exception as e:
            logger.error(f"Failed to get games for user {username}: {e}")
            return []

    # Generic database methods for authentication
    async def find_one(self, collection_name: str, query: dict):
        """Find one document in a collection"""
        if not self.connected:
            # Use in-memory storage for testing
            if collection_name == "users":
                for user_data in self._users.values():
                    if all(user_data.get(key) == value for key, value in query.items()):
                        return user_data
            return None
            
        try:
            collection = self.db[collection_name]
            return collection.find_one(query)
        except Exception as e:
            logger.error(f"Failed to find document in {collection_name}: {e}")
            return None
    
    async def insert_one(self, collection_name: str, document: dict):
        """Insert one document into a collection"""
        if not self.connected:
            # Use in-memory storage for testing
            if collection_name == "users":
                self._users[document.get("username")] = document
            return document
            
        try:
            collection = self.db[collection_name]
            collection.insert_one(document)
            return document
        except Exception as e:
            logger.error(f"Failed to insert document into {collection_name}: {e}")
            raise
