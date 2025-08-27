# app/api/streaming.py
"""Server-Sent Events streaming endpoints"""
from flask import Blueprint, Response, current_app, jsonify
from app.services.sse_service import SSEService
from app.services.redis_service import RedisService
import json
import time

bp = Blueprint('streaming', __name__)

@bp.route('/stream/<task_id>')
def stream_plots(task_id):
    """SSE endpoint for streaming plot updates"""
    sse_service = SSEService()
    redis_service = RedisService()
    
    def generate():
        """Generator for SSE stream"""
        # Send initial connection message
        yield sse_service.format_message({
            'type': 'connected',
            'task_id': task_id
        })
        
        # Send current state if available
        current_state = redis_service.get_task_progress(task_id)
        if current_state:
            yield sse_service.format_message({
                'type': 'current_state',
                'state': current_state
            })
        
        # Stream updates
        last_heartbeat = time.time()
        timeout = current_app.config['SSE_TIMEOUT']
        heartbeat_interval = current_app.config['SSE_HEARTBEAT_INTERVAL']
        
        while True:
            # Get message from queue (blocking with timeout)
            message = redis_service.get_sse_message(task_id, timeout=1)
            
            if message:
                yield sse_service.format_message(message)
                
                # Check for completion
                if message.get('type') == 'calculation_complete':
                    break
                    
                last_heartbeat = time.time()
            else:
                # Send heartbeat if needed
                if time.time() - last_heartbeat > heartbeat_interval:
                    yield sse_service.format_heartbeat()
                    last_heartbeat = time.time()
                
                # Check for timeout
                if time.time() - last_heartbeat > timeout:
                    yield sse_service.format_message({'type': 'timeout'})
                    break
            
            # Check if task was cancelled
            if redis_service.is_task_cancelled(task_id):
                yield sse_service.format_message({'type': 'cancelled'})
                break
    
    response = Response(generate(), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'  # Disable Nginx buffering
    response.headers['Connection'] = 'keep-alive'
    return response

@bp.route('/plots/<task_id>/snapshot', methods=['GET'])
def get_plot_snapshot(task_id):
    """Get current state of all plots"""
    redis_service = RedisService()
    
    # Try to get complete results first
    results = redis_service.get_task_results(task_id)
    if results:
        return jsonify(results.get('complete_plots', {}))
    
    # Get current progress if task is running
    progress = redis_service.get_task_progress(task_id)
    if progress:
        return jsonify({
            'status': 'running',
            'state': progress
        })
    
    return jsonify({'error': 'No data available'}), 404