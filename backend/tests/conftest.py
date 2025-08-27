# backend/tests/conftest.py
"""Pytest configuration and fixtures"""
import pytest
from app import create_app
from app.extensions import redis_client
import json

@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['CELERY_TASK_ALWAYS_EAGER'] = True
    yield app

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test runner"""
    return app.test_cli_runner()

@pytest.fixture
def redis_mock(monkeypatch):
    """Mock Redis for testing"""
    class RedisMock:
        def __init__(self):
            self.data = {}
        
        def set(self, key, value, ex=None):
            self.data[key] = value
        
        def get(self, key):
            return self.data.get(key)
        
        def delete(self, key):
            if key in self.data:
                del self.data[key]
        
        def rpush(self, key, value):
            if key not in self.data:
                self.data[key] = []
            self.data[key].append(value)
        
        def blpop(self, key, timeout=1):
            if key in self.data and self.data[key]:
                return (key, self.data[key].pop(0))
            return None
        
        def expire(self, key, seconds):
            pass
    
    mock = RedisMock()
    monkeypatch.setattr('app.services.redis_service.redis_client', mock)
    return mock
