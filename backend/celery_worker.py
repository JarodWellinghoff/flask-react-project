# celery_worker.py - Enhanced with logging configuration
"""Celery worker entry point with logging support"""
import logging
import logging.handlers
from pathlib import Path
from app import create_app
from app.extensions import celery

# Import all tasks to ensure they're registered
from app.tasks import calculations, batch_calculations

# Configure logging for Celery worker
def setup_celery_logging():
    """Configure logging specifically for Celery workers"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Configure log format with task context
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [Task: %(task_name)s] [ID: %(task_id)s] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Fallback formatter for non-task logging
    basic_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(basic_formatter)
    console_handler.setLevel(logging.INFO)
    
    # Celery tasks file handler
    celery_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'celery_tasks.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    celery_handler.setFormatter(formatter)
    celery_handler.setLevel(logging.DEBUG)
    
    # Error file handler for celery
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'celery_errors.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(celery_handler)
    root_logger.addHandler(error_handler)
    
    # Configure celery logger
    celery_logger = logging.getLogger('celery')
    celery_logger.setLevel(logging.INFO)
    
    # Configure our app task loggers
    app_logger = logging.getLogger('app.tasks')
    app_logger.setLevel(logging.DEBUG)
    
    logging.info("Celery logging configured successfully")

# Custom logging filter to add task context
class TaskContextFilter(logging.Filter):
    """Add task context to log records"""
    
    def filter(self, record):
        # Try to get current task context
        try:
            from celery import current_task
            if current_task and current_task.request:
                record.task_name = getattr(current_task.request, 'task', 'unknown')
                record.task_id = getattr(current_task.request, 'id', 'no-id')[:8]
            else:
                record.task_name = 'no-task'
                record.task_id = 'no-id'
        except Exception:
            record.task_name = 'no-task'
            record.task_id = 'no-id'
        
        return True

# Set up logging before creating the app
setup_celery_logging()

# Add task context filter to celery task loggers
task_filter = TaskContextFilter()
for handler in logging.getLogger().handlers:
    handler.addFilter(task_filter)

# Create Flask app for context
app = create_app()
app.app_context().push()

if __name__ == '__main__':
    celery.start()