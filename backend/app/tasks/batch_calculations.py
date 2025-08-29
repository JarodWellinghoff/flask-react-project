# app/tasks/batch_calculations.py - Enhanced with structured logging
"""Batch calculation tasks with comprehensive logging"""
from app.extensions import celery
from app.services.redis_service import RedisService
from app.services.message_queue import MessageQueue
from app.tasks.plot_generators import PlotDataGenerator
from app.utils.task_logger import TaskLogger, log_task_execution
import time
import numpy as np

@celery.task(bind=True)
@log_task_execution
def batch_calculation_task(self, batch_config):
    """Execute multiple calculations sequentially with detailed logging"""
    task_id = self.request.id
    task_logger = TaskLogger(task_id, 'batch_calculation')
    
    redis_service = RedisService()
    message_queue = MessageQueue()
    plot_generator = PlotDataGenerator()
    
    tests = batch_config.get('tests', [])
    total_tests = len(tests)
    
    # Log batch initialization
    task_logger.info("Starting batch calculation", {
        'total_tests': total_tests,
        'test_names': [test.get('name', f'Test {i+1}') for i, test in enumerate(tests)]
    })
    
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
        
        # Send batch started message
        message_queue.send_batch_update(
            task_id, 
            'batch_started',
            total_tests=total_tests
        )
        
        test_timings = []
        
        for test_index, test_config in enumerate(tests):
            test_start_time = time.time()
            test_name = test_config.get('name', f'Test {test_index + 1}')
            
            task_logger.log_test_progress(test_index, total_tests, test_name)
            
            # Update batch progress
            batch_metadata['current_test_index'] = test_index
            redis_service.store_task_metadata(task_id, batch_metadata)
            
            # Send test started message
            message_queue.send_batch_update(
                task_id,
                'test_started',
                test_index=test_index,
                test_name=test_name,
                test_config=test_config
            )
            
            # Run individual calculation with logging
            test_result = run_single_calculation(
                task_id, 
                test_index,
                test_config, 
                redis_service, 
                message_queue, 
                plot_generator,
                task_logger
            )
            
            test_duration = time.time() - test_start_time
            test_timings.append(test_duration)
            
            # Log test completion
            task_logger.info(f"Completed {test_name}", {
                'test_index': test_index + 1,
                'duration': f'{test_duration:.2f}s',
                'final_accuracy': f"{test_result['final_metrics']['final_accuracy']:.2f}%",
                'final_loss': f"{test_result['final_metrics']['final_loss']:.4f}",
                'avg_test_duration': f'{np.mean(test_timings):.2f}s'
            })
            
            # Store individual test result
            batch_metadata['test_results'].append(test_result)
            batch_metadata['completed_tests'] = test_index + 1
            redis_service.store_task_metadata(task_id, batch_metadata)
            
            # Send test completed message
            message_queue.send_batch_update(
                task_id,
                'test_completed',
                test_index=test_index,
                test_name=test_name,
                test_result=test_result,
                batch_progress=int((test_index + 1) / total_tests * 100)
            )
            
            # Check for cancellation
            if redis_service.is_task_cancelled(task_id):
                task_logger.warning("Batch cancelled by user", {
                    'completed_tests': test_index + 1,
                    'remaining_tests': total_tests - test_index - 1
                })
                raise Exception('Batch cancelled by user')
        
        # Calculate batch summary
        batch_summary = calculate_batch_summary(batch_metadata['test_results'])
        
        # Log batch summary
        task_logger.info("Batch calculation completed successfully", {
            'total_tests': total_tests,
            'total_duration': f'{sum(test_timings):.2f}s',
            'avg_test_duration': f'{np.mean(test_timings):.2f}s',
            'best_accuracy': f"{batch_summary['best_final_accuracy']:.2f}%",
            'avg_accuracy': f"{batch_summary['avg_final_accuracy']:.2f}%",
            'best_performing_test': batch_summary['best_performing_test']
        })
        
        # Final batch results
        final_results = {
            'status': 'completed',
            'total_tests': total_tests,
            'completed_tests': total_tests,
            'test_results': batch_metadata['test_results'],
            'batch_summary': batch_summary,
            'timing_stats': {
                'total_duration': sum(test_timings),
                'avg_test_duration': np.mean(test_timings),
                'min_test_duration': min(test_timings),
                'max_test_duration': max(test_timings)
            }
        }
        
        # Store final results
        redis_service.store_task_results(task_id, final_results)
        
        # Send batch completion message
        message_queue.send_batch_update(
            task_id,
            'batch_completed',
            batch_summary=batch_summary,
            total_tests=total_tests
        )
        
        return final_results
        
    except Exception as e:
        import traceback
        error_message = str(e)
        
        task_logger.error("Batch calculation failed", {
            'error_type': type(e).__name__,
            'error_message': error_message,
            'completed_tests': batch_metadata.get('completed_tests', 0),
            'total_tests': total_tests,
            'current_test': batch_metadata.get('current_test_index', -1) + 1,
            'traceback': traceback.format_exc()
        }, exc_info=True)
        
        # Send error message
        message_queue.send_batch_update(
            task_id,
            'batch_error',
            error=error_message
        )
        
        redis_service.update_task_progress(task_id, {
            'status': 'failed',
            'error': error_message
        })
        
        raise

def run_single_calculation(task_id, test_index, test_config, redis_service, message_queue, plot_generator, parent_logger):
    """Run a single calculation within a batch with detailed logging"""
    num_iterations = test_config.get('num_iterations', 30)
    test_params = test_config.get('test_params', {})
    test_name = test_config.get('name', f'Test {test_index + 1}')
    
    # Create test-specific logger
    test_logger = TaskLogger(f"{task_id}-{test_index}", f'test_{test_index + 1}')
    
    test_logger.info(f"Starting {test_name}", {
        'num_iterations': num_iterations,
        'test_params': test_params
    })
    
    # Initialize collectors for complete data
    all_convergence_data = []
    all_accuracy_data = []
    all_performance_data = []
    final_error_distribution = None
    
    iteration_timings = []
    
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
        
        iteration_duration = time.time() - iteration_start_time
        iteration_timings.append(iteration_duration)
        
        # Log every 5th iteration or final iteration to reduce log volume
        if (i + 1) % 5 == 0 or i == num_iterations - 1:
            test_logger.debug(f"{test_name} iteration progress", {
                'iteration': f'{i + 1}/{num_iterations}',
                'progress': f'{int((i + 1) / num_iterations * 100)}%',
                'iteration_time': f'{iteration_duration:.2f}s',
                'avg_iteration_time': f'{np.mean(iteration_timings):.2f}s',
                'loss': f'{plot_data["convergence_point"]["loss"]:.4f}',
                'accuracy': f'{plot_data["accuracy_point"]["accuracy"]:.2f}%'
            })
        
        # Store the final error distribution
        if i == num_iterations - 1:
            final_error_distribution = plot_data['plots']['error_distribution']
        
        # Send iteration progress
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
            test_logger.warning(f"{test_name} cancelled", {'at_iteration': i + 1})
            raise Exception('Task cancelled by user')
    
    # Calculate final metrics for this test
    final_metrics = plot_generator.calculate_final_metrics(
        all_convergence_data,
        all_accuracy_data,
        all_performance_data
    )
    
    # Log test completion with performance stats
    test_logger.info(f"{test_name} completed", {
        'total_iterations': num_iterations,
        'total_time': f'{sum(iteration_timings):.2f}s',
        'avg_iteration_time': f'{np.mean(iteration_timings):.2f}s',
        'final_accuracy': f"{final_metrics['final_accuracy']:.2f}%",
        'final_loss': f"{final_metrics['final_loss']:.4f}",
        'avg_throughput': f"{final_metrics['avg_throughput']:.0f} ops/s"
    })
    
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
        'test_name': test_name,
        'test_config': test_config,
        'final_metrics': final_metrics,
        'complete_plots': complete_plots,
        'status': 'completed',
        'timing_stats': {
            'total_duration': sum(iteration_timings),
            'avg_iteration_time': np.mean(iteration_timings),
            'min_iteration_time': min(iteration_timings),
            'max_iteration_time': max(iteration_timings)
        }
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