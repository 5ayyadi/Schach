import aio_pika
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Callable, Optional
from core.settings import settings

logger = logging.getLogger(__name__)

class RabbitMQManager:
    """Extended RabbitMQ manager for move fallback delivery"""
    
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange_name = "chess_moves"
        self.queue_prefix = "pending_moves"
    
    async def connect(self):
        """Connect to RabbitMQ using aio_pika for async operations"""
        try:
            self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            self.channel = await self.connection.channel()
            
            # Declare exchange for move routing
            self.exchange = await self.channel.declare_exchange(
                self.exchange_name, 
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )
            
            logger.info("Connected to RabbitMQ")
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from RabbitMQ"""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Disconnected from RabbitMQ")
    
    async def publish_pending_move(self, game_id: str, recipient_username: str, move_data: Dict[str, Any]):
        """Publish a move to be delivered when the recipient reconnects"""
        try:
            routing_key = f"game.{game_id}.pending.{recipient_username}"
            
            message = {
                "type": "move_made",
                "game_id": move_data["game_id"],
                "username": move_data["username"],
                "move": move_data["move"],
                "fen": move_data["fen"],
                "timestamp": move_data["timestamp"],
                "recipient": recipient_username
            }
            
            await self.exchange.publish(
                aio_pika.Message(
                    json.dumps(message).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                ),
                routing_key=routing_key
            )
            
            logger.info(f"Published pending move for {recipient_username} in game {game_id}")
            
        except Exception as e:
            logger.error(f"Failed to publish pending move: {e}")
            raise

    async def deliver_pending_moves(self, game_id: str, username: str, websocket):
        """Deliver all pending moves to a reconnected user"""
        try:
            queue_name = f"{self.queue_prefix}.{game_id}.{username}"
            routing_key = f"game.{game_id}.pending.{username}"
            
            # Declare queue for this user's pending moves
            queue = await self.channel.declare_queue(queue_name, durable=True)
            await queue.bind(self.exchange, routing_key)
            
            delivered_count = 0
            # Get all pending messages
            while True:
                try:
                    message = await queue.get(timeout=1.0)  # Short timeout
                    if message is None:
                        break
                        
                    move_data = json.loads(message.body.decode())
                    
                    # Send the move via WebSocket
                    await websocket.send_text(json.dumps(move_data))
                    
                    # Acknowledge the message (this removes it from the queue)
                    await message.ack()
                    delivered_count += 1
                    
                    logger.info(f"Delivered pending move to {username} in game {game_id}")
                    
                except aio_pika.exceptions.QueueEmpty:
                    break
                except Exception as e:
                    logger.error(f"Error delivering pending move: {e}")
                    if 'message' in locals():
                        await message.nack(requeue=True)
                    break
            
            if delivered_count > 0:
                logger.info(f"Successfully delivered {delivered_count} pending moves to {username} in game {game_id}")
            else:
                logger.info(f"No pending moves found for {username} in game {game_id}")
                    
        except Exception as e:
            logger.error(f"Failed to deliver pending moves: {e}")

    # Keep the old method for backward compatibility (correspondence games)
    async def publish_move_event(self, move_data: Dict[str, Any]):
        """Publish a move event for correspondence games (legacy method)"""
        try:
            routing_key = f"game.{move_data['game_id']}.correspondence"
            
            message = {
                "type": "move_made",
                "game_id": move_data["game_id"],
                "username": move_data["username"],
                "move": move_data["move"],
                "fen": move_data["fen"],
                "timestamp": move_data["timestamp"]
            }
            
            await self.exchange.publish(
                aio_pika.Message(
                    json.dumps(message).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                ),
                routing_key=routing_key
            )
            
            logger.info(f"Published correspondence move for game {move_data['game_id']}")
            
        except Exception as e:
            logger.error(f"Failed to publish correspondence move: {e}")
            raise


# Global RabbitMQ manager instance
rabbitmq_manager = RabbitMQManager()
