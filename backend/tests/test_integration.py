# backend/tests/test_integration.py
"""Integration tests"""
import pytest
import time
import json

@pytest.mark.integration
def test_full_calculation_flow(client, redis_mock):
    """Test complete calculation flow"""
    # Start calculation
    response = client.post('/api/start-calculation',
        json={'num_iterations': 5}
    )
    assert response.status_code == 202
    data = json.loads(response.data)
    task_id = data['task_id']
    
    # Check status
    response = client.get(f'/api/task-status/{task_id}')
    assert response.status_code == 200
    
    # Note: In testing mode with CELERY_TASK_ALWAYS_EAGER,
    # tasks execute synchronously