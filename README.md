# Chess Game - Docker Setup

This Docker Compose setup runs the entire chess game application with all its dependencies.

## Architecture

The application consists of four services that start in the following order:

1. **MongoDB** - Database for storing game data and user information
2. **RabbitMQ** - Message queue for real-time game communication
3. **Backend** - FastAPI server (depends on MongoDB and RabbitMQ)
4. **Frontend** - React/Vite development server (depends on Backend)

## Prerequisites

- Docker and Docker Compose installed on your system
- Ports 3000, 8000, 5672, 15672, and 27017 available on your host machine

## Quick Start

1. Clone the repository and navigate to the project root:
   ```bash
   cd /path/to/3-schach
   ```

2. Start all services:
   ```bash
   docker-compose up --build
   ```

3. Wait for all services to start (this may take a few minutes on first run)

4. Access the application:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## Service Details

### MongoDB
- **Port**: 27017
- **Database**: chess_game
- **Credentials**: admin/password
- **Initialization**: Runs init-mongo.js on first startup

### RabbitMQ
- **AMQP Port**: 5672
- **Management UI**: 15672
- **Credentials**: guest/guest

### Backend (FastAPI)
- **Port**: 8000
- **Health Check**: http://localhost:8000/api/health
- **Auto-reload**: Enabled for development
- **Environment Variables**:
  - `DEBUG=true`
  - `MONGODB_URL=mongodb://admin:password@mongodb:27017/chess_game?authSource=admin`
  - `RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/`

### Frontend (React/Vite)
- **Port**: 3000
- **Hot Reload**: Enabled for development
- **Environment Variables**:
  - `VITE_API_URL=http://localhost:8000/api`
  - `VITE_WS_URL=ws://localhost:8000/ws`

## Development Commands

### Start all services
```bash
docker-compose up
```

### Start services in background
```bash
docker-compose up -d
```

### Rebuild and start (after code changes)
```bash
docker-compose up --build
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (clean slate)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
docker-compose logs rabbitmq
```

### Execute commands in running containers
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password --authenticationDatabase admin
```

## Troubleshooting

### Services won't start
1. Check if required ports are available:
   ```bash
   netstat -tulpn | grep -E ':(3000|8000|5672|15672|27017)'
   ```

2. Check service health:
   ```bash
   docker-compose ps
   ```

### Backend can't connect to database
- Wait for MongoDB to be fully initialized (check logs)
- Verify MongoDB is healthy: `docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"`

### Frontend can't reach backend
- Verify backend is running and healthy: `curl http://localhost:8000/api/health`
- Check backend logs for errors: `docker-compose logs backend`

### Reset everything
```bash
docker-compose down -v --remove-orphans
docker-compose up --build
```

## Production Notes

For production deployment, consider:

1. Change default passwords and secrets
2. Use environment-specific configurations
3. Set up proper logging and monitoring
4. Use production-optimized Docker images
5. Implement proper backup strategies for MongoDB
6. Set up SSL/TLS termination
7. Use Docker secrets for sensitive data

## File Structure

```
.
├── docker-compose.yml          # Main orchestration file
├── backend/
│   ├── Dockerfile             # Backend container definition
│   ├── .dockerignore          # Backend build exclusions
│   └── ...                    # Backend source code
├── frontend/
│   ├── Dockerfile             # Frontend container definition
│   ├── .dockerignore          # Frontend build exclusions
│   └── ...                    # Frontend source code
└── README.md                  # This file
```
