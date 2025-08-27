# app/tasks/plot_generators.py
"""Plot data generation utilities"""
import numpy as np
from datetime import datetime

class PlotDataGenerator:
    """Generate plot data for various visualization types"""
    
    def generate_iteration_data(self, iteration, total_iterations):
        """Generate plot data for a single iteration"""
        i = iteration
        
        # Generate data points
        convergence_point = {
            'x': i + 1,
            'loss': 100 * np.exp(-i / 10) + np.random.normal(0, 2),
            'val_loss': 110 * np.exp(-i / 10) + np.random.normal(0, 3)
        }
        
        accuracy_point = {
            'x': i + 1,
            'accuracy': min(95, 50 + i * 4 + np.random.normal(0, 2)),
            'precision': min(98, 55 + i * 3.5 + np.random.normal(0, 1.5)),
            'recall': min(96, 48 + i * 4.2 + np.random.normal(0, 2.5))
        }
        
        performance_point = {
            'time': i + 1,
            'throughput': 1000 + i * 50 + np.random.normal(0, 20),
            'memory': 512 + i * 10 + np.random.normal(0, 5),
            'cpu': min(100, 30 + i * 2 + np.random.normal(0, 10))
        }
        
        # Generate error distribution (more refined for final iteration)
        if i == total_iterations - 1:
            # Generate a more comprehensive error distribution for the final iteration
            errors = np.random.normal(0, 1 / (i + 1), 500).tolist()  # More samples for final
        else:
            errors = np.random.normal(0, 1 / (i + 1), 100).tolist()
        
        # Prepare plot update
        plots = {
            'convergence': {
                'type': 'line',
                'new_point': convergence_point,
                'full_data': None
            },
            'accuracy': {
                'type': 'line',
                'new_point': accuracy_point,
                'full_data': None
            },
            'performance': {
                'type': 'multi_line',
                'new_point': performance_point,
                'full_data': None
            },
            'error_distribution': {
                'type': 'histogram',
                'data': errors,
                'stats': {
                    'mean': np.mean(errors),
                    'std': np.std(errors),
                    'min': np.min(errors),
                    'max': np.max(errors)
                }
            }
        }
        
        return {
            'convergence_point': convergence_point,
            'accuracy_point': accuracy_point,
            'performance_point': performance_point,
            'plots': plots
        }
    
    def calculate_final_metrics(self, convergence_data, accuracy_data, performance_data):
        """Calculate final metrics from complete data"""
        return {
            'final_loss': convergence_data[-1]['loss'] if convergence_data else 0,
            'final_accuracy': accuracy_data[-1]['accuracy'] if accuracy_data else 0,
            'avg_throughput': np.mean([p['throughput'] for p in performance_data]) if performance_data else 0,
            'total_memory': performance_data[-1]['memory'] if performance_data else 0,
            'peak_cpu': max([p['cpu'] for p in performance_data]) if performance_data else 0
        }