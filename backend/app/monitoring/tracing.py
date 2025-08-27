# app/monitoring/tracing.py
"""Distributed tracing with OpenTelemetry"""
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
import os

def setup_tracing(app):
    """Setup OpenTelemetry tracing"""
    if not os.getenv('ENABLE_TRACING', 'false').lower() == 'true':
        return
    
    # Set up the tracer provider
    trace.set_tracer_provider(TracerProvider())
    tracer = trace.get_tracer(__name__)
    
    # Configure OTLP exporter (e.g., to Jaeger)
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv('OTLP_ENDPOINT', 'localhost:4317'),
        insecure=True
    )
    
    # Add span processor
    span_processor = BatchSpanProcessor(otlp_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)
    
    # Instrument Flask
    FlaskInstrumentor().instrument_app(app)
    
    # Instrument Celery
    CeleryInstrumentor().instrument()
    
    # Instrument Redis
    RedisInstrumentor().instrument()
    
    return tracer