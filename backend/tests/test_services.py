# backend/tests/test_services.py
"""Service layer tests"""
import pytest
from app.services.redis_service import RedisService
from app.services.data_processing import DataProcessor
import numpy as np

def test_redis_service_task_metadata(app, redis_mock):
    """Test Redis service task metadata operations"""
    with app.app_context():
        service = RedisService()
        service.redis = redis_mock
        
        task_id = 'test-123'
        metadata = {'num_iterations': 10, 'status': 'running'}
        
        service.store_task_metadata(task_id, metadata)
        retrieved = service.get_task_metadata(task_id)
        
        assert retrieved == metadata

def test_data_processor_histogram():
    """Test histogram creation"""
    data = [1, 2, 2, 3, 3, 3, 4, 4, 5]
    bins = DataProcessor.create_histogram(data, num_bins=5)
    
    assert len(bins) == 5
    assert all('count' in bin for bin in bins)
    assert sum(bin['count'] for bin in bins) == len(data)

def test_data_processor_decimation():
    """Test data decimation"""
    data = list(range(1000))
    decimated = DataProcessor.decimate_data(data, max_points=100)
    
    assert len(decimated) <= 100
    assert decimated[0] == 0
    assert decimated[-1] in data

def test_data_processor_statistics():
    """Test statistics calculation"""
    data = [1, 2, 3, 4, 5]
    stats = DataProcessor.calculate_statistics(data)
    
    assert stats['mean'] == 3
    assert stats['min'] == 1
    assert stats['max'] == 5
    assert 'std' in stats
    assert 'median' in stats