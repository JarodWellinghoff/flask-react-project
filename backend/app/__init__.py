# app/__init__.py
"""Flask application factory (updated)"""
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
    from app.api import calculations, streaming, results
    
    app.register_blueprint(calculations.bp, url_prefix='/api')
    app.register_blueprint(streaming.bp, url_prefix='/api')
    app.register_blueprint(results.bp, url_prefix='/api')