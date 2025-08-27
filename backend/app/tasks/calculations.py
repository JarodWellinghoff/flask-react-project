# app/tasks/calculations.py
"""Calculation tasks"""
from app.extensions import celery
from app.services.redis_service import RedisService
from app.services.sse_service import SSEService
from app.tasks.plot_generators import PlotDataGenerator
import time
import numpy as np

@celery.task(bind=True)
def long_calculation_task(self, num_iterations, test_params):
    """Execute long-running calculation with plot generation"""
    task_id = self.request.id
    redis_service = RedisService()
    sse_service = SSEService()
    plot_generator = PlotDataGenerator()
    
    # Initialize collectors for complete data
    all_convergence_data = []
    all_accuracy_data = []
    all_performance_data = []
    final_error_distribution = None
    
    try:
        for i in range(num_iterations):
            # Simulate computation
            time.sleep(np.random.uniform(0.5, 1.5))  # Replace with actual calculation

            # Generate plot data
            plot_data = plot_generator.generate_iteration_data(i, num_iterations)
            
            # Collect complete data
            all_convergence_data.append(plot_data['convergence_point'])
            all_accuracy_data.append(plot_data['accuracy_point'])
            all_performance_data.append(plot_data['performance_point'])
            
            # Store the final error distribution (from last iteration)
            if i == num_iterations - 1:
                final_error_distribution = plot_data['plots']['error_distribution']
            
            # Create SSE update message - only send progress, not plot data
            sse_message = {
                'type': 'plot_update',
                'iteration': i + 1,
                'total_iterations': num_iterations,
                'progress': int((i + 1) / num_iterations * 100),
                # Remove plots from real-time updates
                # 'plots': plot_data['plots']
            }
            
            # Send SSE message
            sse_service.queue_message(task_id, sse_message)
            
            # Update progress in Redis
            redis_service.update_task_progress(task_id, {
                'current_iteration': i + 1,
                'total_iterations': num_iterations,
                'progress': int((i + 1) / num_iterations * 100),
                'status': 'running'
            })
            
            # Check for cancellation
            if redis_service.is_task_cancelled(task_id):
                raise Exception('Task cancelled by user')
        
        # Calculate final metrics
        final_metrics = plot_generator.calculate_final_metrics(
            all_convergence_data,
            all_accuracy_data,
            all_performance_data
        )
        
        # Prepare complete plot data
        complete_plots = {
            'convergence': all_convergence_data,
            'accuracy': all_accuracy_data,
            'performance': all_performance_data,
        }
        
        # Add error distribution if available
        if final_error_distribution:
            complete_plots['error_distribution'] = final_error_distribution
        
        # Prepare final results
        final_results = {
            'status': 'completed',
            'total_iterations': num_iterations,
            'final_metrics': final_metrics,
            'complete_plots': complete_plots
        }
        
        # Store final results
        redis_service.store_task_results(task_id, final_results)
        
        # Send completion message with complete plot data
        sse_service.queue_message(task_id, {
            'type': 'calculation_complete',
            'task_id': task_id,
            'summary': final_metrics,
            'complete_plots': complete_plots  # Include complete plot data
        })
        
        return final_metrics
        
    except Exception as e:
        # Handle errors
        error_message = str(e)
        sse_service.queue_message(task_id, {
            'type': 'error',
            'error': error_message
        })
        redis_service.update_task_progress(task_id, {
            'status': 'failed',
            'error': error_message
        })
        raise