# app/extensions.py
"""Initialize Flask extensions"""
from flask_cors import CORS
from flask_redis import FlaskRedis
from celery import Celery

cors = CORS()
redis_client = FlaskRedis()
celery = Celery()

# app/__init__.py
"""Flask application factory"""
from flask import Flask
from app.config import get_config
from app.extensions import cors, redis_client, celery

def create_app(config_name=None):
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Initialize extensions
    init_extensions(app)
    
    # Register blueprints
    register_blueprints(app)
    
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