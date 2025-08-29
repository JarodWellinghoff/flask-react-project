# app/utils/task_logger.py
"""Task logging utilities"""
import logging
import time
import functools
from typing import Any, Dict

class TaskLogger:
    """Enhanced logger for Celery tasks with structured logging"""
    
    def __init__(self, task_id: str, task_name: str | None = None):
        self.task_id = task_id
        self.task_name = task_name or "unknown_task"
        self.logger = logging.getLogger(f'app.tasks.{self.task_name}')
        self.start_time = time.time()
        
    def _format_message(self, message: str, extra: Dict[str, Any] | None = None) -> str:
        """Format log message with task context"""
        prefix = f"[{self.task_id[:8]}]"
        if extra:
            extra_str = " | ".join([f"{k}={v}" for k, v in extra.items()])
            return f"{prefix} {message} | {extra_str}"
        return f"{prefix} {message}"
    
    def debug(self, message: str, extra: Dict[str, Any] | None = None):
        """Log debug message"""
        self.logger.debug(self._format_message(message, extra))
    
    def info(self, message: str, extra: Dict[str, Any] | None = None):
        """Log info message"""
        self.logger.info(self._format_message(message, extra))
    
    def warning(self, message: str, extra: Dict[str, Any] | None = None):
        """Log warning message"""
        self.logger.warning(self._format_message(message, extra))
    
    def error(self, message: str, extra: Dict[str, Any] | None = None, exc_info: bool = False):
        """Log error message"""
        self.logger.error(self._format_message(message, extra), exc_info=exc_info)
    
    def log_iteration(self, current: int, total: int, extra: Dict[str, Any] | None = None):
        """Log iteration progress"""
        progress = int((current / total) * 100) if total > 0 else 0
        elapsed = time.time() - self.start_time
        eta = (elapsed / current * (total - current)) if current > 0 else 0
        
        log_extra = {
            'progress': f'{progress}%',
            'iteration': f'{current}/{total}',
            'elapsed': f'{elapsed:.1f}s',
            'eta': f'{eta:.1f}s'
        }
        
        if extra:
            log_extra.update(extra)
            
        self.info(f"Iteration progress", log_extra)
    
    def log_test_progress(self, test_index: int, total_tests: int, test_name: str | None = None):
        """Log test progress in batch calculations"""
        progress = int(((test_index + 1) / total_tests) * 100) if total_tests > 0 else 0
        test_display = test_name or f"Test {test_index + 1}"
        
        self.info(f"Test progress: {test_display}", {
            'test_index': test_index + 1,
            'total_tests': total_tests,
            'batch_progress': f'{progress}%'
        })
    
    def log_performance_metrics(self, metrics: Dict[str, Any]):
        """Log performance metrics"""
        self.info("Performance metrics", metrics)
    
    def log_task_start(self, params: Dict[str, Any] | None = None):
        """Log task start"""
        self.info(f"Task {self.task_name} started", params or {})
    
    def log_task_complete(self, duration: float | None = None, results: Dict[str, Any] | None = None):
        """Log task completion"""
        total_duration = duration or (time.time() - self.start_time)
        log_data = {'duration': f'{total_duration:.2f}s'}
        
        if results:
            log_data.update(results)
            
        self.info(f"Task {self.task_name} completed successfully", log_data)
    
    def log_task_error(self, error: Exception, context: Dict[str, Any] | None = None):
        """Log task error"""
        error_data = {
            'error_type': type(error).__name__,
            'error_message': str(error)
        }
        
        if context:
            error_data.update(context)
            
        self.error(f"Task {self.task_name} failed", error_data, exc_info=True)


def log_task_execution(func):
    """Decorator to automatically log task execution"""
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        task_logger = TaskLogger(self.request.id, func.__name__)
        
        # Log task start
        task_logger.log_task_start({
            'args': args,
            'kwargs': {k: v for k, v in kwargs.items() if 'password' not in k.lower()}
        })
        
        start_time = time.time()
        
        try:
            result = func(self, *args, **kwargs)
            
            # Log successful completion
            duration = time.time() - start_time
            task_logger.log_task_complete(duration, {'status': 'success'})
            
            return result
            
        except Exception as e:
            # Log error
            duration = time.time() - start_time
            task_logger.log_task_error(e, {
                'duration': f'{duration:.2f}s',
                'args_count': len(args),
                'kwargs_keys': list(kwargs.keys())
            })
            raise
    
    return wrapper