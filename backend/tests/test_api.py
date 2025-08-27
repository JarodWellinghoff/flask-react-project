# backend/tests/test_api.py
"""API endpoint tests"""
import pytest
import json

def test_start_calculation(client, redis_mock):
    """Test starting a calculation"""
    response = client.post('/api/start-calculation',
        json={'num_iterations': 10, 'test_params': {'seed': 42}}
    )
    assert response.status_code == 202
    data = json.loads(response.data)
    assert 'task_id' in data
    assert 'stream_url' in data

def test_start_calculation_invalid_params(client):
    """Test starting calculation with invalid parameters"""
    response = client.post('/api/start-calculation',
        json={'num_iterations': -1}
    )
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'errors' in data

def test_get_task_status(client, redis_mock):
    """Test getting task status"""
    task_id = 'test-task-123'
    redis_mock.set(f'progress_{task_id}', json.dumps({
        'progress': 50,
        'current_iteration': 5,
        'total_iterations': 10
    }))
    
    response = client.get(f'/api/task-status/{task_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['progress'] == 50

def test_cancel_task(client, redis_mock):
    """Test cancelling a task"""
    task_id = 'test-task-123'
    response = client.post(f'/api/cancel/{task_id}')
    assert response.status_code == 200