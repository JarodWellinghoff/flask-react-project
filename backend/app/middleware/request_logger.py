# app/middleware/request_logger.py
"""Request logging middleware"""
import logging
import time
from flask import request, g

logger = logging.getLogger(__name__)

def register_request_logger(app):
    """Register request logging middleware"""
    
    @app.before_request
    def log_request_start():
        """Log request start and timing"""
        g.start_time = time.time()
        logger.info(f'Request started: {request.method} {request.path}')
    
    @app.after_request
    def log_request_end(response):
        """Log request completion"""
        if hasattr(g, 'start_time'):
            elapsed = time.time() - g.start_time
            logger.info(
                f'Request completed: {request.method} {request.path} '
                f'- Status: {response.status_code} - Time: {elapsed:.3f}s'
            )
        return response