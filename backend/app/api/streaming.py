# app/api/streaming.py
from flask import Blueprint, Response, current_app, jsonify, stream_with_context
from app.services.sse_service import SSEService
from app.services.redis_service import RedisService
import json, time

bp = Blueprint('streaming', __name__)

@bp.route('/stream/<task_id>')
def stream_plots(task_id):
    """SSE endpoint for streaming plot updates"""
    app = current_app._get_current_object()           # capture real app
    cfg = app.config                                  # freeze config for generator

    # Instantiate services before streaming (they may rely on app config)
    sse_service = SSEService()
    redis_service = RedisService()

    @stream_with_context
    def generate():
        """Generator for SSE stream"""
        # Initial hello
        yield sse_service.format_message({'type': 'connected', 'task_id': task_id})

        # Snapshot if present
        state = redis_service.get_task_progress(task_id)
        if state:
            yield sse_service.format_message({'type': 'current_state', 'state': state})

        # Timers
        start_time = time.time()
        last_activity = time.time()                   # activity = any event/heartbeat sent
        hb_interval = cfg.get('SSE_HEARTBEAT_INTERVAL', 30)
        timeout = cfg.get('SSE_TIMEOUT', 300)

        try:
            while True:
                # Blocking poll from Redis (short timeout)
                msg = redis_service.get_sse_message(task_id, timeout=1)

                if msg:
                    yield sse_service.format_message(msg)
                    last_activity = time.time()
                    if msg.get('type') == 'calculation_complete':
                        break
                else:
                    now = time.time()
                    # heartbeat
                    if now - last_activity >= hb_interval:
                        yield sse_service.format_heartbeat()
                        last_activity = now

                # cancellation
                if redis_service.is_task_cancelled(task_id):
                    yield sse_service.format_message({'type': 'cancelled'})
                    break

                # absolute timeout (since connection start)
                if time.time() - start_time >= timeout:
                    yield sse_service.format_message({'type': 'timeout'})
                    break

        except GeneratorExit:
            # client disconnected
            pass
        except Exception as e:
            # don't raise after headers sent; emit SSE error
            yield sse_service.format_message({'type': 'error', 'message': str(e)})

    resp = Response(generate(), mimetype='text/event-stream')
    resp.headers['Cache-Control'] = 'no-cache'
    resp.headers['X-Accel-Buffering'] = 'no'
    resp.headers['Connection'] = 'keep-alive'
    return resp

@bp.route('/plots/<task_id>/snapshot', methods=['GET'])
def get_plot_snapshot(task_id):
    """Get current state of all plots"""
    redis_service = RedisService()
    results = redis_service.get_task_results(task_id)
    if results:
        return jsonify(results.get('complete_plots', {}))
    progress = redis_service.get_task_progress(task_id)
    if progress:
        return jsonify({'status': 'running', 'state': progress})
    return jsonify({'error': 'No data available'}), 404
