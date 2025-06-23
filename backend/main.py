import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.settings import settings
from database.repository import init_db
from message_queue.rabbitmq import rabbitmq_manager
from routers.game import router as game_router
from routers.websocket import router as websocket_router
from routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    print("Starting up...")
    await init_db()
    try:
        await rabbitmq_manager.connect()
        print("RabbitMQ connected")
    except Exception as e:
        print(f"Warning: Could not connect to RabbitMQ: {e}")
    print("Startup complete!")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    try:
        await rabbitmq_manager.disconnect()
    except Exception:
        pass
    print("Shutdown complete!")


app = FastAPI(
    title="Lightweight Chess Backend",
    description="FEN-based chess game backend with WebSocket and RabbitMQ support",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:8000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(game_router, prefix="/api/games", tags=["games"])
app.include_router(websocket_router, prefix="/ws", tags=["websocket"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Lightweight Chess Backend is running", "status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
