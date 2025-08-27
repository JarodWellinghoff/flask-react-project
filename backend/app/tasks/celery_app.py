# app/tasks/celery_app.py
"""Celery application initialization"""
from app import create_app
from app.extensions import celery

# Create Flask app for context
flask_app = create_app()
flask_app.app_context().push()

