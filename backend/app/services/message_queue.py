# app/services/message_queue.py
"""Message queue with acknowledgment support for SSE communications"""
import uuid
import time
import logging
from app.services.redis_service import RedisService
from app.services.sse_service import SSEService

logger = logging.getLogger(__name__)

class MessageQueue:
    """Handle message queuing with acknowledgment support"""
    
    def __init__(self):
        self.redis_service = RedisService()
        self.sse_service = SSEService()
    
    def send_message(self, task_id, message, requires_ack=False):
        """Send a message, optionally requiring acknowledgment"""
        if requires_ack:
            return self.send_with_ack(task_id, message)
        else:
            self.sse_service.queue_message(task_id, message)
            return None
    
    def send_with_ack(self, task_id, message, timeout=10):
        """Send message and wait for acknowledgment"""
        message_id = str(uuid.uuid4())
        message['message_id'] = message_id
        message['requires_ack'] = True
        
        logger.debug(f"Sending message {message_id} for task {task_id}")
        
        # Send the message
        self.sse_service.queue_message(task_id, message)
        
        # Wait for acknowledgment
        start_time = time.time()
        check_interval = 0.1  # Check every 100ms
        
        while time.time() - start_time < timeout:
            if self.redis_service.get_message_ack(task_id, message_id):
                logger.debug(f"Message {message_id} acknowledged")
                return message_id
            
            # Check if task was cancelled during wait
            if self.redis_service.is_task_cancelled(task_id):
                logger.info(f"Task {task_id} cancelled while waiting for ack")
                return None
            
            time.sleep(check_interval)
        
        # Timeout reached
        logger.warning(f"Message {message_id} acknowledgment timeout after {timeout}s")
        return message_id  # Return anyway, don't block the task
    
    def send_batch_update(self, task_id, message_type, **kwargs):
        """Send batch-related updates with appropriate acknowledgment requirements"""
        
        # Messages that require acknowledgment for proper UI flow
        critical_messages = {
            'test_completed',
            'batch_completed', 
            'batch_started'
        }
        
        message = {
            'type': message_type,
            task_id: task_id,
            **kwargs
        }
        
        requires_ack = message_type in critical_messages
        
        return self.send_message(task_id, message, requires_ack=requires_ack)