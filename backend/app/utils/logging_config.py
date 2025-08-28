# app/utils/logging_config.py
"""Logging configuration"""
import logging
import logging.handlers
import os
from pathlib import Path

def setup_logging(app):
    """Configure logging for the application"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Configure log format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'app.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)
    
    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'error.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)
    
    # Configure root logger - this will handle all logging
    root_logger = logging.getLogger()
    
    # Clear any existing handlers to avoid duplicates
    root_logger.handlers.clear()
    
    root_logger.setLevel(logging.DEBUG if app.config['DEBUG'] else logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)
    
    # Configure app logger - just set level, don't add handlers
    app.logger.setLevel(logging.DEBUG if app.config['DEBUG'] else logging.INFO)
    # Don't add handlers to app.logger - let it propagate to root
    app.logger.propagate = True  # This is the default, but being explicit
    
    # Configure werkzeug logger
    werkzeug_logger = logging.getLogger('werkzeug')
    werkzeug_logger.setLevel(logging.WARNING)
    
    # Log startup
    app.logger.info(f"Application starting in {app.config.get('ENV', 'production')} mode")