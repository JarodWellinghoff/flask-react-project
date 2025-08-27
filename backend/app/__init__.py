
# Update app/__init__.py to include middleware
"""Flask application factory (updated)"""
from flask import Flask
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
    def health_check():
        """Health check endpoint"""
        return {'status': 'healthy', 'service': 'calculation-api'}, 200
    
    return app