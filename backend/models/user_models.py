from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class User(BaseModel):
    """User model for authentication"""
    username: str = Field(..., description="Unique username")
    password_hash: str = Field(..., description="Hashed password")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda dt: dt.isoformat()
        }
    )


class UserCreate(BaseModel):
    """Request model for user registration"""
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    password: str = Field(..., min_length=4, description="Password (minimum 4 characters)")


class UserLogin(BaseModel):
    """Request model for user login"""
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class Token(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"
    username: str


class UserResponse(BaseModel):
    """Public user response model"""
    username: str
    created_at: datetime
