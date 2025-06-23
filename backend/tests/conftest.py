"""
Test configuration and fixtures for backend tests
"""

import pytest
import os
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from jose import jwt

from main import app
from core.settings import settings


# Set test environment to disable MongoDB connection issues
os.environ["TEST_MODE"] = "true"


@pytest.fixture
def client():
    """FastAPI test client fixture"""
    return TestClient(app)


def create_test_token(username: str) -> str:
    """Create a test JWT token for a given username"""
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    data = {"sub": username, "exp": expire}
    token = jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


@pytest.fixture
def white_player():
    """Fixture for white player with authentication headers"""
    token = create_test_token("WhitePlayer")
    return {
        "username": "WhitePlayer",
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.fixture  
def black_player():
    """Fixture for black player with authentication headers"""
    token = create_test_token("BlackPlayer")
    return {
        "username": "BlackPlayer", 
        "headers": {"Authorization": f"Bearer {token}"}
    }
