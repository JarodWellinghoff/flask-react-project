# app/__init__.py
"""Flask application factory (updated with batch support)"""
from flask import Flask  # type: ignore
from app.config import get_config
from app.extensions import cors, redis_client, celery
from app.middleware.error_handler import register_error_handlers
from app.middleware.request_logger import register_request_logger
from app.utils.logging_config import setup_logging

def create_app(config_name=None):
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Setup logging
    setup_logging(app)
    
    # Initialize extensions
    init_extensions(app)
    
    # Register middleware
    register_error_handlers(app)
    register_request_logger(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Health check endpoint
    @app.route('/health')
    @app.route('/')
    def health_check():
        """Health check endpoint"""
        return {'status': 'healthy', 'service': 'calculation-api'}, 200

    
    return app

def init_extensions(app):
    """Initialize Flask extensions"""
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])
    redis_client.init_app(app, decode_responses=True)
    
    # Initialize Celery
    celery.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND'],
        task_track_started=app.config['CELERY_TASK_TRACK_STARTED'],
        task_time_limit=app.config['CELERY_TASK_TIME_LIMIT'],
        broker_connection_retry_on_startup=app.config.get(
            'CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP', True
        ),
        accept_content=['json'],
        task_serializer='json',
        result_serializer='json',
    )
    
    # Update task base name to be consistent with app's name
    class ContextTask(celery.Task):
        """Make celery tasks work with Flask app context"""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

def register_blueprints(app):
    """Register Flask blueprints"""
    from app.api import calculations, streaming, results, batch_calculations
    
    app.register_blueprint(calculations.bp, url_prefix='/api')
    app.register_blueprint(streaming.bp, url_prefix='/api')
    app.register_blueprint(results.bp, url_prefix='/api')
    app.register_blueprint(batch_calculations.bp, url_prefix='/api')  # New batch blueprint

# Also need to update the validators.py file to include the batch validation function
# app/utils/validators.py - Updated with batch validation
"""Request validation utilities"""

def validate_calculation_params(data):
    """Validate calculation parameters"""
    errors = []
    
    if not data:
        return ['No data provided']
    
    # Validate num_iterations
    num_iterations = data.get('num_iterations')
    if num_iterations is None:
        errors.append('num_iterations is required')
    elif not isinstance(num_iterations, int):
        errors.append('num_iterations must be an integer')
    elif num_iterations < 1:
        errors.append('num_iterations must be at least 1')
    elif num_iterations > 1000:
        errors.append('num_iterations cannot exceed 1000')
    
    # Validate test_params if provided
    test_params = data.get('test_params', {})
    if not isinstance(test_params, dict):
        errors.append('test_params must be a dictionary')
    
    return errors

def validate_batch_params(data):
    """Validate batch calculation parameters"""
    errors = []
    
    if not data:
        return ['No data provided']
    
    batch_config = data.get('batch_config', {})
    if not isinstance(batch_config, dict):
        errors.append('batch_config must be a dictionary')
        return errors
    
    tests = batch_config.get('tests', [])
    if not isinstance(tests, list):
        errors.append('tests must be a list')
    elif len(tests) == 0:
        errors.append('At least one test configuration is required')
    elif len(tests) > 10:  # Reasonable limit
        errors.append('Maximum 10 tests allowed per batch')
    
    # Validate each test configuration
    for i, test in enumerate(tests):
        if not isinstance(test, dict):
            errors.append(f'Test {i+1} configuration must be a dictionary')
            continue
            
        # Validate num_iterations for each test
        num_iterations = test.get('num_iterations')
        if num_iterations is None:
            errors.append(f'Test {i+1}: num_iterations is required')
        elif not isinstance(num_iterations, int):
            errors.append(f'Test {i+1}: num_iterations must be an integer')
        elif num_iterations < 1:
            errors.append(f'Test {i+1}: num_iterations must be at least 1')
        elif num_iterations > 100:
            errors.append(f'Test {i+1}: num_iterations cannot exceed 100')
        
        # Validate test_params if provided
        test_params = test.get('test_params', {})
        if not isinstance(test_params, dict):
            errors.append(f'Test {i+1}: test_params must be a dictionary')
    
    return errors

def validate_task_id(task_id):
    """Validate task ID format"""
    if not task_id:
        return False
    
    # Check for valid UUID format (Celery task IDs)
    import re
    uuid_pattern = re.compile(
        r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(task_id))