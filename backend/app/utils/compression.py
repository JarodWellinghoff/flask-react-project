# app/utils/compression.py
"""Compression utilities"""
import gzip
import io
import base64
from flask import Response, current_app

def compress_response(data, format='json'):
    """Compress response data if above threshold"""
    import json
    
    if format == 'json':
        json_str = json.dumps(data) if not isinstance(data, str) else data
        
        if len(json_str) > current_app.config.get('COMPRESSION_THRESHOLD', 50000):
            gz_buffer = io.BytesIO()
            with gzip.GzipFile(mode='wb', fileobj=gz_buffer) as gz_file:
                gz_file.write(json_str.encode())
            
            response = Response(gz_buffer.getvalue())
            response.headers['Content-Encoding'] = 'gzip'
            response.headers['Content-Type'] = 'application/json'
            return response
        
        return Response(json_str, mimetype='application/json')
    
    return Response(data)

def compress_for_sse(data):
    """Compress data for SSE transmission"""
    import json
    
    json_str = json.dumps(data)
    
    # Only compress if data is large
    if len(json_str) > 1000:
        compressed = gzip.compress(json_str.encode())
        return {
            'compressed': True,
            'data': base64.b64encode(compressed).decode()
        }
    
    return data
