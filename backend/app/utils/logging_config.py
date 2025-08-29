# app/utils/logging_config.py - Enhanced with environment-specific configs
"""Environment-specific logging configuration for Flask and Celery"""
import logging
import logging.handlers
import os
import json
from pathlib import Path
from datetime import datetime

class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging in production"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add task-specific fields if available
        if hasattr(record, 'task_id'):
            log_entry['task_id'] = record.task_id
        if hasattr(record, 'task_name'):
            log_entry['task_name'] = record.task_name
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra'):
            log_entry.update(record.extra)
        
        return json.dumps(log_entry)

class ColoredConsoleFormatter(logging.Formatter):
    """Colored formatter for development console output"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record):
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Add task context if available
        task_context = ""
        if hasattr(record, 'task_id') and hasattr(record, 'task_name'):
            task_context = f"[{record.task_name}:{record.task_id[:8]}] "
        
        # Format the message
        formatted = super().format(record)
        return f"{color}{task_context}{formatted}{self.RESET}"

def setup_flask_logging(app):
    """Configure logging for Flask application"""
    env = app.config.get('ENV', 'production')
    
    if env == 'development':
        setup_development_logging()
    else:
        setup_production_logging()
    
    # Configure app-specific logger
    app_logger = logging.getLogger('app')
    app_logger.setLevel(logging.DEBUG if app.config['DEBUG'] else logging.INFO)

def setup_celery_logging(env='production'):
    """Configure logging for Celery workers"""
    
    if env == 'development':
        setup_development_logging()
    else:
        setup_production_logging()
    
    # Configure celery-specific loggers
    celery_logger = logging.getLogger('celery')
    celery_logger.setLevel(logging.INFO)
    
    task_logger = logging.getLogger('app.tasks')
    task_logger.setLevel(logging.DEBUG if env == 'development' else logging.INFO)

def setup_development_logging():
    """Setup logging for development environment"""
    
    # Create logs directory
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Colored console formatter for development
    console_formatter = ColoredConsoleFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # File formatter for development (human readable)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(module)s:%(funcName)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler with colors
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.DEBUG)
    
    # Development file handler
    file_handler = logging.FileHandler(log_dir / 'development.log')
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(logging.DEBUG)
    
    # Task-specific file handler for development
    task_handler = logging.FileHandler(log_dir / 'tasks_dev.log')
    task_handler.setFormatter(file_formatter)
    task_handler.setLevel(logging.DEBUG)
    task_handler.addFilter(TaskLogFilter())
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(task_handler)
    
    # Suppress noisy loggers in development
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

def setup_production_logging():
    """Setup logging for production environment"""
    
    # Create logs directory
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Structured JSON formatter for production
    json_formatter = StructuredFormatter()
    
    # Console handler (minimal in production)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(json_formatter)
    console_handler.setLevel(logging.INFO)
    
    # Application log with rotation
    app_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'application.log',
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=10
    )
    app_handler.setFormatter(json_formatter)
    app_handler.setLevel(logging.INFO)
    
    # Task-specific log with rotation
    task_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'tasks.log',
        maxBytes=100 * 1024 * 1024,  # 100MB
        backupCount=20
    )
    task_handler.setFormatter(json_formatter)
    task_handler.setLevel(logging.INFO)
    task_handler.addFilter(TaskLogFilter())
    
    # Error-only log
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'errors.log',
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=10
    )
    error_handler.setFormatter(json_formatter)
    error_handler.setLevel(logging.ERROR)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(app_handler)
    root_logger.addHandler(task_handler)
    root_logger.addHandler(error_handler)
    
    # Production logger levels
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    logging.getLogger('urllib3').setLevel(logging.ERROR)
    logging.getLogger('redis').setLevel(logging.WARNING)

class TaskLogFilter(logging.Filter):
    """Filter to only pass task-related logs"""
    
    def filter(self, record):
        # Pass if it's from our task modules
        if record.name.startswith('app.tasks'):
            return True
        
        # Pass if it has task context
        if hasattr(record, 'task_id') or hasattr(record, 'task_name'):
            return True
        
        # Pass celery logs
        if record.name.startswith('celery'):
            return True
        
        return False

class PerformanceLogFilter(logging.Filter):
    """Filter for performance-related logs"""
    
    def filter(self, record):
        # Look for performance keywords in the message
        performance_keywords = ['duration', 'timing', 'performance', 'metrics', 'throughput']
        message = record.getMessage().lower()
        
        return any(keyword in message for keyword in performance_keywords)

def setup_monitoring_logging():
    """Setup additional logging for monitoring and alerting"""
    
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Performance metrics log
    perf_handler = logging.FileHandler(log_dir / 'performance.log')
    perf_handler.setFormatter(StructuredFormatter())
    perf_handler.setLevel(logging.INFO)
    perf_handler.addFilter(PerformanceLogFilter())
    
    # Get performance logger
    perf_logger = logging.getLogger('performance')
    perf_logger.addHandler(perf_handler)
    perf_logger.setLevel(logging.INFO)
    perf_logger.propagate = False  # Don't propagate to root logger
    
    # Error aggregation log (for alerting)
    error_agg_handler = logging.FileHandler(log_dir / 'error_alerts.log')
    error_agg_handler.setFormatter(StructuredFormatter())
    error_agg_handler.setLevel(logging.ERROR)
    
    error_logger = logging.getLogger('alerts')
    error_logger.addHandler(error_agg_handler)
    error_logger.setLevel(logging.ERROR)
    error_logger.propagate = False

# Utility function to get environment from various sources
def get_environment():
    """Determine the current environment"""
    return os.getenv('FLASK_ENV', os.getenv('ENV', 'production'))

# Main setup function
def setup_logging(app=None):
    """Main logging setup function"""
    env = get_environment()
    
    if app:
        setup_flask_logging(app)
    else:
        setup_celery_logging(env)
    
    # Setup monitoring logs in production
    if env == 'production':
        setup_monitoring_logging()
    
    logging.info(f"Logging configured for {env} environment")