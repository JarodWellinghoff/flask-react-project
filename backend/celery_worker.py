# celery_worker.py - Updated to include batch tasks
"""Celery worker entry point with batch task support"""
from app import create_app
from app.extensions import celery

# Import all tasks to ensure they're registered
from app.tasks import calculations, batch_calculations

app = create_app()
app.app_context().push()

if __name__ == '__main__':
    celery.start()