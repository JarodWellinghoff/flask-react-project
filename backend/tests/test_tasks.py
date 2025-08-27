# backend/tests/test_tasks.py
"""Celery task tests"""
import pytest
from app.tasks.calculations import long_calculation_task
from app.tasks.plot_generators import PlotDataGenerator

def test_plot_data_generator():
    """Test plot data generation"""
    generator = PlotDataGenerator()
    data = generator.generate_iteration_data(5, 10)
    
    assert 'convergence_point' in data
    assert 'accuracy_point' in data
    assert 'performance_point' in data
    assert 'plots' in data
    
    assert data['convergence_point']['x'] == 6
    assert 'loss' in data['convergence_point']
    assert 'val_loss' in data['convergence_point']

def test_final_metrics_calculation():
    """Test final metrics calculation"""
    generator = PlotDataGenerator()
    
    convergence_data = [{'x': 1, 'loss': 10, 'val_loss': 11}]
    accuracy_data = [{'x': 1, 'accuracy': 90, 'precision': 88, 'recall': 92}]
    performance_data = [{'time': 1, 'throughput': 1000, 'memory': 512, 'cpu': 50}]
    
    metrics = generator.calculate_final_metrics(
        convergence_data, accuracy_data, performance_data
    )
    
    assert metrics['final_loss'] == 10
    assert metrics['final_accuracy'] == 90
    assert metrics['avg_throughput'] == 1000