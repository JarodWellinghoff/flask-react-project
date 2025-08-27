# app/api/calculations.py
"""Calculation endpoints"""
from flask import Blueprint, jsonify, request
from app.tasks.calculations import long_calculation_task
from app.utils.validators import validate_calculation_params
from app.services.redis_service import RedisService

bp = Blueprint('calculations', __name__)
redis_service = RedisService()

@bp.route('/start-calculation', methods=['POST'])
def start_calculation():
    """Start a new calculation task"""
    data = request.json
    
    # Validate input
    errors = validate_calculation_params(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    num_iterations = data.get('num_iterations', 30)
    test_params = data.get('test_params', {})
    
    # Start Celery task
    task = long_calculation_task.apply_async(
        args=[num_iterations, test_params]
    )
    
    # Store task metadata
    redis_service.store_task_metadata(task.id, {
        'num_iterations': num_iterations,
        'test_params': test_params,
        'status': 'started'
    })
    
    return jsonify({
        'task_id': task.id,
        'message': f'Started calculation with {num_iterations} iterations',
        'stream_url': f'/api/stream/{task.id}'
    }), 202

@bp.route('/task-status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get current status of a task (lightweight)"""
    from app.extensions import celery
    
    task = celery.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {'state': 'PENDING', 'progress': 0}
    elif task.state == 'SUCCESS':
        response = {
            'state': 'SUCCESS',
            'progress': 100,
            'summary': task.result
        }
    elif task.state == 'FAILURE':
        response = {
            'state': 'FAILURE',
            'error': str(task.info)
        }
    else:
        # Get progress from Redis
        progress = redis_service.get_task_progress(task_id)
        response = {
            'state': 'PROCESSING',
            **progress
        } if progress else {'state': 'PROCESSING', 'progress': 0}
    
    return jsonify(response)

@bp.route('/cancel/<task_id>', methods=['POST'])
def cancel_task(task_id):
    """Cancel a running task"""
    from app.extensions import celery
    
    celery.control.revoke(task_id, terminate=True)
    redis_service.cleanup_task(task_id)
    
    return jsonify({'message': f'Task {task_id} cancelled'})