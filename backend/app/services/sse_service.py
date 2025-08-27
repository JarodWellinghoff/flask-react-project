# app/services/sse_service.py
"""Server-Sent Events service"""
import json
from app.services.redis_service import RedisService

class SSEService:
    """Handle SSE message formatting and queuing"""
    
    def __init__(self):
        self.redis_service = RedisService()
    
    def format_message(self, data):
        """Format data as SSE message"""
        return f"data: {json.dumps(data)}\n\n"
    
    def format_heartbeat(self):
        """Format heartbeat message"""
        return ": heartbeat\n\n"
    
    def queue_message(self, task_id, message):
        """Queue message for SSE streaming"""
        self.redis_service.queue_sse_message(task_id, message)