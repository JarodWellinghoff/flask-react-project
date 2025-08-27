# app/services/redis_service.py - Enhanced with acknowledgment support
"""Redis service for data storage and retrieval with message acknowledgment support"""
from app.extensions import redis_client
from flask import current_app
import json
import time

class RedisService:
    """Handle Redis operations"""
    
    def __init__(self):
        self.redis = redis_client
        
    def store_task_metadata(self, task_id, metadata):
        """Store task metadata"""
        key = f'task_meta_{task_id}'
        self.redis.set(key, json.dumps(metadata), 
                      ex=current_app.config['RESULT_EXPIRY_SECONDS'])
    
    def get_task_metadata(self, task_id):
        """Get task metadata"""
        data = self.redis.get(f'task_meta_{task_id}')
        return json.loads(data) if data else None
    
    def update_task_progress(self, task_id, progress):
        """Update task progress"""
        key = f'progress_{task_id}'
        self.redis.set(key, json.dumps(progress),
                      ex=current_app.config['RESULT_EXPIRY_SECONDS'])
    
    def get_task_progress(self, task_id):
        """Get task progress"""
        data = self.redis.get(f'progress_{task_id}')
        return json.loads(data) if data else None
    
    def store_task_results(self, task_id, results):
        """Store final task results"""
        key = f'results_{task_id}'
        self.redis.set(key, json.dumps(results),
                      ex=current_app.config['RESULT_EXPIRY_SECONDS'])
    
    def get_task_results(self, task_id):
        """Get task results"""
        data = self.redis.get(f'results_{task_id}')
        return json.loads(data) if data else None
    
    def queue_sse_message(self, task_id, message):
        """Queue SSE message for streaming"""
        key = f'sse_queue_{task_id}'
        self.redis.rpush(key, json.dumps(message))
        self.redis.expire(key, current_app.config['SSE_REDIS_QUEUE_TTL'])
    
    def get_sse_message(self, task_id, timeout=1):
        """Get SSE message from queue (blocking)"""
        key = f'sse_queue_{task_id}'
        message = self.redis.blpop(key, timeout=timeout)
        if message:
            return json.loads(message[1])
        return None
    
    def is_task_cancelled(self, task_id):
        """Check if task is cancelled"""
        return self.redis.get(f'cancelled_{task_id}') is not None
    
    def mark_task_cancelled(self, task_id):
        """Mark task as cancelled"""
        self.redis.set(f'cancelled_{task_id}', '1', ex=60)
    
    def store_message_ack(self, task_id, message_id):
        """Store message acknowledgment"""
        key = f'ack_{task_id}_{message_id}'
        self.redis.set(key, '1', ex=300)  # 5 minute expiry
    
    def get_message_ack(self, task_id, message_id):
        """Check if message has been acknowledged"""
        key = f'ack_{task_id}_{message_id}'
        return self.redis.get(key) is not None
    
    def cleanup_task(self, task_id):
        """Clean up all task-related data"""
        keys_to_delete = [
            f'task_meta_{task_id}',
            f'progress_{task_id}',
            f'results_{task_id}',
            f'sse_queue_{task_id}',
            f'cancelled_{task_id}'
        ]
        
        # Also cleanup acknowledgment keys
        ack_pattern = f'ack_{task_id}_*'
        ack_keys = self.redis.keys(ack_pattern)
        if ack_keys:
            keys_to_delete.extend(ack_keys)
        
        for key in keys_to_delete:
            self.redis.delete(key)