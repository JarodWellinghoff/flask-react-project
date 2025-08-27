# app/monitoring/metrics.py
"""Prometheus metrics for monitoring"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from flask import Response
import time
from functools import wraps

# Define metrics
calculation_started = Counter(
    'calculation_started_total',
    'Total number of calculations started',
    ['num_iterations']
)

calculation_completed = Counter(
    'calculation_completed_total',
    'Total number of calculations completed'
)

calculation_failed = Counter(
    'calculation_failed_total',
    'Total number of calculations failed'
)

calculation_duration = Histogram(
    'calculation_duration_seconds',
    'Time spent processing calculation',
    buckets=[1, 5, 10, 30, 60, 120, 300, 600]
)

active_calculations = Gauge(
    'active_calculations',
    'Number of currently running calculations'
)

sse_connections = Gauge(
    'sse_connections_active',
    'Number of active SSE connections'
)

api_request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint', 'status']
)

api_request_count = Counter(
    'api_request_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

redis_operations = Counter(
    'redis_operations_total',
    'Total Redis operations',
    ['operation', 'status']
)

def track_request_metrics(f):
    """Decorator to track API request metrics"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        try:
            result = f(*args, **kwargs)
            status = result[1] if isinstance(result, tuple) else 200
            return result
        except Exception as e:
            status = 500
            raise
        finally:
            duration = time.time() - start_time
            from flask import request
            api_request_duration.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=status
            ).observe(duration)
            api_request_count.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=status
            ).inc()
    return decorated_function

def register_metrics_endpoint(app):
    """Register Prometheus metrics endpoint"""
    @app.route('/metrics')
    def metrics():
        return Response(generate_latest(), mimetype='text/plain')







