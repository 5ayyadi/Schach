"""
Authentication Router - REST API endpoints for user authentication

Provides endpoints for:
- User registration
- User login
- Token verification
"""

from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials

from models.user_models import UserCreate, UserLogin, Token, UserResponse
from services.auth_service import AuthService, get_current_user, security
from database.repository import GameRepository, get_repository

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, repository: GameRepository = Depends(get_repository)):
    """Register a new user"""
    auth_service = AuthService(repository)
    user = await auth_service.create_user(user_data)
    return UserResponse(username=user.username, created_at=user.created_at)


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, repository: GameRepository = Depends(get_repository)):
    """Login user and return access token"""
    auth_service = AuthService(repository)
    return await auth_service.login(user_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(username=current_user.username, created_at=current_user.created_at)


@router.post("/verify")
async def verify_token(current_user = Depends(get_current_user)):
    """Verify if token is valid"""
    return {"valid": True, "username": current_user.username}
