# app/api/batch_calculations.py
"""Batch calculation endpoints"""
from flask import Blueprint, jsonify, request
from app.tasks.batch_calculations import batch_calculation_task
from app.utils.validators import validate_batch_params
from app.services.redis_service import RedisService

bp = Blueprint('batch_calculations', __name__)
redis_service = RedisService()

@bp.route('/start-batch-calculation', methods=['POST'])
def start_batch_calculation():
    """Start a new batch calculation task"""
    data = request.json
    
    # Validate input
    errors = validate_batch_params(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    batch_config = data.get('batch_config', {})
    tests = batch_config.get('tests', [])
    
    if not tests:
        return jsonify({'errors': ['At least one test configuration is required']}), 400
    
    # Start Celery task
    task = batch_calculation_task.apply_async(
        args=[batch_config]
    )
    
    # Store task metadata
    redis_service.store_task_metadata(task.id, {
        'type': 'batch_calculation',
        'total_tests': len(tests),
        'batch_config': batch_config,
        'status': 'started'
    })
    
    return jsonify({
        'task_id': task.id,
        'message': f'Started batch calculation with {len(tests)} tests',
        'stream_url': f'/api/stream/{task.id}',
        'total_tests': len(tests)
    }), 202

@bp.route('/batch-status/<task_id>', methods=['GET'])
def get_batch_status(task_id):
    """Get current status of a batch task"""
    from app.extensions import celery
    
    task = celery.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {'state': 'PENDING', 'batch_progress': 0}
    elif task.state == 'SUCCESS':
        response = {
            'state': 'SUCCESS',
            'batch_progress': 100,
            'batch_summary': task.result.get('batch_summary', {})
        }
    elif task.state == 'FAILURE':
        response = {
            'state': 'FAILURE',
            'error': str(task.info)
        }
    else:
        # Get progress from Redis
        metadata = redis_service.get_task_metadata(task_id)
        progress = redis_service.get_task_progress(task_id)
        
        response = {'state': 'PROCESSING'}
        
        if metadata:
            completed_tests = metadata.get('completed_tests', 0)
            total_tests = metadata.get('total_tests', 1)
            response.update({
                'batch_progress': int(completed_tests / total_tests * 100),
                'completed_tests': completed_tests,
                'total_tests': total_tests,
                'current_test_index': metadata.get("current_test_index", 0)
            })
        
        if progress:
            response.update({
                'current_test_progress': progress.get('test_progress', 0),
                'current_iteration': progress.get('current_iteration', 0),
                'total_iterations': progress.get('total_iterations', 0)
            })
        print(jsonify(response))
    
    return jsonify(response)

@bp.route('/batch-results/<task_id>', methods=['GET'])
def get_batch_results(task_id):
    """Get results for completed tests in a batch"""
    results = redis_service.get_task_results(task_id)
    if not results:
        metadata = redis_service.get_task_metadata(task_id)
        if metadata and 'test_results' in metadata:
            return jsonify({
                'test_results': metadata['test_results'],
                'completed_tests': metadata.get('completed_tests', 0),
                'total_tests': metadata.get('total_tests', 0)
            })
        return jsonify({'error': 'Results not found'}), 404
    
    return jsonify({
        'test_results': results.get('test_results', []),
        'batch_summary': results.get('batch_summary', {}),
        'completed_tests': results.get('completed_tests', 0),
        'total_tests': results.get('total_tests', 0)
    })

