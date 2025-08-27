# app/extensions.py
"""Initialize Flask extensions"""
from flask_cors import CORS
from flask_redis import FlaskRedis
from celery import Celery

cors = CORS()
redis_client = FlaskRedis()
celery = Celery()
