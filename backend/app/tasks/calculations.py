# app/tasks/calculations.py - Enhanced with structured logging
"""Calculation tasks with comprehensive logging"""
from app.extensions import celery
from app.services.redis_service import RedisService
from app.services.sse_service import SSEService
from app.tasks.plot_generators import PlotDataGenerator
from app.utils.task_logger import TaskLogger, log_task_execution
import time
import numpy as np

@celery.task(bind=True)
@log_task_execution
def long_calculation_task(self, num_iterations, test_params):
    """Execute long-running calculation with comprehensive logging"""
    task_id = self.request.id
    task_logger = TaskLogger(task_id, 'long_calculation')
    
    redis_service = RedisService()
    sse_service = SSEService()
    plot_generator = PlotDataGenerator()
    
    # Initialize collectors for complete data
    all_convergence_data = []
    all_accuracy_data = []
    all_performance_data = []
    final_error_distribution = None
    
    # Log task initialization
    task_logger.info("Initializing calculation", {
        'num_iterations': num_iterations,
        'test_params': test_params
    })
    
    try:
        for i in range(num_iterations):
            iteration_start_time = time.time()
            
            # Simulate computation
            compute_time = np.random.uniform(0.5, 1.5)
            time.sleep(compute_time)
            
            # Generate plot data
            plot_data = plot_generator.generate_iteration_data(i, num_iterations)
            
            # Collect complete data
            all_convergence_data.append(plot_data['convergence_point'])
            all_accuracy_data.append(plot_data['accuracy_point'])
            all_performance_data.append(plot_data['performance_point'])
            
            # Store the final error distribution (from last iteration)
            if i == num_iterations - 1:
                final_error_distribution = plot_data['plots']['error_distribution']
            
            # Log iteration details
            iteration_duration = time.time() - iteration_start_time
            task_logger.log_iteration(i + 1, num_iterations, {
                'compute_time': f'{compute_time:.2f}s',
                'iteration_duration': f'{iteration_duration:.2f}s',
                'loss': f'{plot_data["convergence_point"]["loss"]:.4f}',
                'accuracy': f'{plot_data["accuracy_point"]["accuracy"]:.2f}%'
            })
            
            # Create SSE update message
            sse_message = {
                'type': 'plot_update',
                'iteration': i + 1,
                'total_iterations': num_iterations,
                'progress': int((i + 1) / num_iterations * 100),
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
                task_logger.warning("Task cancelled by user", {'at_iteration': i + 1})
                raise Exception('Task cancelled by user')
        
        # Calculate final metrics
        final_metrics = plot_generator.calculate_final_metrics(
            all_convergence_data,
            all_accuracy_data,
            all_performance_data
        )
        
        # Log final metrics
        task_logger.log_performance_metrics({
            'final_loss': final_metrics['final_loss'],
            'final_accuracy': final_metrics['final_accuracy'],
            'avg_throughput': final_metrics['avg_throughput'],
            'total_memory': final_metrics['total_memory'],
            'peak_cpu': final_metrics['peak_cpu']
        })
        
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
            'complete_plots': complete_plots
        })
        
        task_logger.info("Calculation completed successfully", {
            'total_iterations': num_iterations,
            'final_accuracy': f"{final_metrics['final_accuracy']:.2f}%",
            'final_loss': f"{final_metrics['final_loss']:.4f}"
        })
        
        return final_metrics
        
    except Exception as e:
        # Handle errors with detailed logging
        error_message = str(e)
        
        task_logger.error("Calculation failed", {
            'error_type': type(e).__name__,
            'error_message': error_message,
            'completed_iterations': len(all_convergence_data),
            'total_iterations': num_iterations
        }, exc_info=True)
        
        # Send error message
        sse_service.queue_message(task_id, {
            'type': 'error',
            'error': error_message
        })
        
        redis_service.update_task_progress(task_id, {
            'status': 'failed',
            'error': error_message
        })
        
        raise