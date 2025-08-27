# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

    # Redis (default to Docker hostname `redis`, not localhost)
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')

    # Celery (use a separate DB for results by default)
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', REDIS_URL)
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/1')

    CELERY_TASK_TRACK_STARTED = True
    CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

    # Celery robustness
    CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

    # CORS, SSE, Data unchanged...
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    SSE_REDIS_QUEUE_TTL = 3600
    SSE_HEARTBEAT_INTERVAL = 30
    SSE_TIMEOUT = 300
    MAX_PLOT_POINTS = 1000
    RESULT_EXPIRY_SECONDS = 3600
    COMPRESSION_THRESHOLD = 50000

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    ENV = 'production'

    # Override with production values
    REDIS_URL = os.environ.get('REDIS_URL')
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # Production optimizations
    CELERY_WORKER_PREFETCH_MULTIPLIER = 1
    CELERY_TASK_ACKS_LATE = True

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    CELERY_TASK_ALWAYS_EAGER = True  # Execute tasks synchronously

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])