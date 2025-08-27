# app/tasks/batch_calculations.py - Updated with acknowledgment system
"""Batch calculation tasks for running multiple calculations sequentially"""
from app.extensions import celery
from app.services.redis_service import RedisService
from app.services.message_queue import MessageQueue
from app.tasks.plot_generators import PlotDataGenerator
import time
import numpy as np
import logging

logger = logging.getLogger(__name__)

@celery.task(bind=True)
def batch_calculation_task(self, batch_config):
    """Execute multiple calculations sequentially"""
    task_id = self.request.id
    redis_service = RedisService()
    message_queue = MessageQueue()
    plot_generator = PlotDataGenerator()
    
    tests = batch_config.get('tests', [])
    total_tests = len(tests)
    
    try:
        # Initialize batch metadata
        batch_metadata = {
            'total_tests': total_tests,
            'completed_tests': 0,
            'current_test_index': 0,
            'status': 'running',
            'test_results': []
        }
        redis_service.store_task_metadata(task_id, batch_metadata)
        
        # Send batch started message (requires acknowledgment)
        message_queue.send_batch_update(
            task_id, 
            'batch_started',
            total_tests=total_tests
        )
        
        for test_index, test_config in enumerate(tests):
            # Update batch progress
            batch_metadata['current_test_index'] = test_index
            redis_service.store_task_metadata(task_id, batch_metadata)
            
            # Send test started message (doesn't require ack - just informational)
            message_queue.send_batch_update(
                task_id,
                'test_started',
                test_index=test_index,
                test_name=test_config.get('name', f'Test {test_index + 1}'),
                test_config=test_config
            )
            
            # Run individual calculation
            test_result = run_single_calculation(
                task_id, 
                test_index,
                test_config, 
                redis_service, 
                message_queue, 
                plot_generator
            )
            
            # Store individual test result
            batch_metadata['test_results'].append(test_result)
            batch_metadata['completed_tests'] = test_index + 1
            redis_service.store_task_metadata(task_id, batch_metadata)
            
            # Send test completed message (requires acknowledgment)
            message_queue.send_batch_update(
                task_id,
                'test_completed',
                test_index=test_index,
                test_name=test_config.get('name', f'Test {test_index + 1}'),
                test_result=test_result,
                batch_progress=int((test_index + 1) / total_tests * 100)
            )
            
            logger.info(f"Completed test {test_index + 1}/{total_tests} for batch {task_id}")
            
            # Check for cancellation
            if redis_service.is_task_cancelled(task_id):
                raise Exception('Batch cancelled by user')
        
        # Calculate batch summary
        batch_summary = calculate_batch_summary(batch_metadata['test_results'])
        
        # Final batch results
        final_results = {
            'status': 'completed',
            'total_tests': total_tests,
            'completed_tests': total_tests,
            'test_results': batch_metadata['test_results'],
            'batch_summary': batch_summary
        }
        
        # Store final results
        redis_service.store_task_results(task_id, final_results)
        
        # Send batch completion message (requires acknowledgment)
        message_queue.send_batch_update(
            task_id,
            'batch_completed',
            batch_summary=batch_summary,
            total_tests=total_tests
        )
        
        logger.info(f"Batch calculation {task_id} completed successfully")
        return final_results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_message = str(e)
        
        # Send error message (doesn't require ack)
        message_queue.send_batch_update(
            task_id,
            'batch_error',
            error=error_message
        )
        
        redis_service.update_task_progress(task_id, {
            'status': 'failed',
            'error': error_message
        })
        
        logger.error(f"Batch calculation {task_id} failed: {error_message}")
        raise

def run_single_calculation(task_id, test_index, test_config, redis_service, message_queue, plot_generator):
    """Run a single calculation within a batch"""
    num_iterations = test_config.get('num_iterations', 30)
    test_params = test_config.get('test_params', {})
    
    # Initialize collectors for complete data
    all_convergence_data = []
    all_accuracy_data = []
    all_performance_data = []
    final_error_distribution = None
    
    for i in range(num_iterations):
        # Simulate computation
        time.sleep(np.random.uniform(0.5, 1.5))
        
        # Generate plot data
        plot_data = plot_generator.generate_iteration_data(i, num_iterations)
        
        # Collect complete data
        all_convergence_data.append(plot_data['convergence_point'])
        all_accuracy_data.append(plot_data['accuracy_point'])
        all_performance_data.append(plot_data['performance_point'])
        
        # Store the final error distribution
        if i == num_iterations - 1:
            final_error_distribution = plot_data['plots']['error_distribution']
        
        # Send iteration progress (doesn't require ack - frequent updates)
        message_queue.send_batch_update(
            task_id,
            'test_iteration_update',
            test_index=test_index,
            iteration=i + 1,
            total_iterations=num_iterations,
            test_progress=int((i + 1) / num_iterations * 100)
        )
        
        # Update progress in Redis
        redis_service.update_task_progress(task_id, {
            'current_test_index': test_index,
            'current_iteration': i + 1,
            'total_iterations': num_iterations,
            'test_progress': int((i + 1) / num_iterations * 100),
            'status': 'running'
        })
        
        # Check for cancellation
        if redis_service.is_task_cancelled(task_id):
            raise Exception('Task cancelled by user')
    
    # Calculate final metrics for this test
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
    
    if final_error_distribution:
        complete_plots['error_distribution'] = final_error_distribution
    
    return {
        'test_index': test_index,
        'test_name': test_config.get('name', f'Test {test_index + 1}'),
        'test_config': test_config,
        'final_metrics': final_metrics,
        'complete_plots': complete_plots,
        'status': 'completed'
    }

def calculate_batch_summary(test_results):
    """Calculate summary statistics for the entire batch"""
    if not test_results:
        return {}
    
    # Extract metrics from all tests
    final_losses = [r['final_metrics']['final_loss'] for r in test_results]
    final_accuracies = [r['final_metrics']['final_accuracy'] for r in test_results]
    avg_throughputs = [r['final_metrics']['avg_throughput'] for r in test_results]
    
    return {
        'total_tests': len(test_results),
        'avg_final_loss': np.mean(final_losses),
        'best_final_loss': np.min(final_losses),
        'worst_final_loss': np.max(final_losses),
        'avg_final_accuracy': np.mean(final_accuracies),
        'best_final_accuracy': np.max(final_accuracies),
        'worst_final_accuracy': np.min(final_accuracies),
        'avg_throughput': np.mean(avg_throughputs),
        'best_performing_test': test_results[np.argmax(final_accuracies)]['test_name'],
        'worst_performing_test': test_results[np.argmin(final_accuracies)]['test_name']
    }