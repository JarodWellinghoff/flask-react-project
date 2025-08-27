# celery_worker.py
"""Celery worker entry point"""
from app import create_app
from app.extensions import celery

app = create_app()
app.app_context().push()

if __name__ == '__main__':
    celery.start()