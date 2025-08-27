# app/services/sse_service.py
"""Server-Sent Events service"""
import json
import time
from app.services.redis_service import RedisService

class SSEService:
    """Handle SSE message formatting and queuing"""
    
    def __init__(self):
        self.redis_service = RedisService()
        self.message_intervals = {}  # Track timing per task
        self.min_interval = 1  # Minimum 500ms between critical messages
    
    def format_message(self, data):
        """Format data as SSE message"""
        return f"data: {json.dumps(data)}\n\n"
    
    def format_heartbeat(self):
        """Format heartbeat message"""
        return ": heartbeat\n\n"
    
    def queue_critical_message(self, task_id, message):
        """Queue message with flow control for critical updates"""
        current_time = time.time()
        last_time = self.message_intervals.get(task_id, 0)
        
        if current_time - last_time < self.min_interval:
            # Wait for the minimum interval
            wait_time = self.min_interval - (current_time - last_time)
            time.sleep(wait_time)
        
        self.queue_message(task_id, message)

    def queue_message(self, task_id, message):
        """Regular message queueing"""
        self.redis_service.queue_sse_message(task_id, message)
        self.message_intervals[task_id] = time.time()