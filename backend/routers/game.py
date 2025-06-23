"""
Game Router - REST API endpoints for chess games

Provides endpoints for:
- Creating games
- Joining games  
- Making moves
- Getting game state
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from schemas.game_schemas import (
    CreateGameRequest,
    JoinGameRequest, 
    MakeMoveRequest,
    GameResponse,
    MoveResponse
)
from services.game_service import game_service
from services.auth_service import get_current_user
from models.user_models import User

router = APIRouter()


@router.post("/", response_model=GameResponse)
async def create_game(request: CreateGameRequest, current_user: User = Depends(get_current_user)):
    """Create a new chess game."""
    try:
        game = await game_service.create_game(
            username=current_user.username,
            time_control=request.time_control
        )
        return GameResponse.from_game_state(game)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{game_id}/join", response_model=GameResponse)
async def join_game(game_id: str, request: JoinGameRequest, current_user: User = Depends(get_current_user)):
    """Join an existing game."""
    try:
        game = await game_service.join_game(game_id, current_user.username)
        return GameResponse.from_game_state(game)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Game not found")


@router.post("/{game_id}/move", response_model=MoveResponse)
async def make_move(game_id: str, request: MakeMoveRequest, current_user: User = Depends(get_current_user)):
    """Make a move in a game."""
    try:
        move_response = await game_service.make_move(
            game_id=game_id,
            username=current_user.username,
            move_uci=request.move
        )
        return move_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Game not found")


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: str):
    """Get current game state."""
    try:
        game = await game_service.get_game(game_id)
        return GameResponse.from_game_state(game)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Game not found")


# @router.get("/", response_model=List[GameResponse])
# async def list_games(status: Optional[str] = None):
#     """List all games, optionally filtered by status."""
#     games = await game_service.list_games(status)
#     return [GameResponse.from_game_state(game) for game in games]
