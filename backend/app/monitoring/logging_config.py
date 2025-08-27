# app/monitoring/logging_config.py (enhanced version)
"""Enhanced logging with structured logging"""
import logging
import json
from pythonjsonlogger import jsonlogger
from datetime import datetime

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging"""
    
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        
        # Add custom fields if available
        if hasattr(record, 'task_id'):
            log_record['task_id'] = record.task_id
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id

def setup_structured_logging(app):
    """Setup structured logging for better observability"""
    
    # JSON formatter for production
    if app.config.get('FLASK_ENV') == 'production':
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
        
        # Configure all handlers with JSON formatter
        for handler in app.logger.handlers:
            handler.setFormatter(formatter)
        
        # Also configure root logger
        for handler in logging.getLogger().handlers:
            handler.setFormatter(formatter)
