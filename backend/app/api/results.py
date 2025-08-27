# app/api/results.py 
"""Results download endpoints"""
from flask import Blueprint, request, jsonify
from app.services.redis_service import RedisService
from app.utils.compression import compress_response
from app.utils.validators import validate_task_id
import csv
import io

bp = Blueprint('results', __name__)
redis_service = RedisService()

@bp.route('/plots/<task_id>/download', methods=['GET'])
def download_plot_data(task_id):
    """Download plot data in various formats"""
    
    # Validate task ID
    if not validate_task_id(task_id):
        return jsonify({'error': 'Invalid task ID'}), 400
    
    format_type = request.args.get('format', 'json')
    
    # Get results from Redis
    results = redis_service.get_task_results(task_id)
    if not results:
        return jsonify({'error': 'Results not found'}), 404
    
    if format_type == 'csv':
        # Convert to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write convergence data
        writer.writerow(['=== Convergence Data ==='])
        writer.writerow(['Iteration', 'Loss', 'Validation Loss'])
        for row in results.get('complete_plots', {}).get('convergence', []):
            writer.writerow([row['x'], row['loss'], row['val_loss']])
        
        writer.writerow([])  # Empty row separator
        
        # Write accuracy data
        writer.writerow(['=== Accuracy Metrics ==='])
        writer.writerow(['Iteration', 'Accuracy', 'Precision', 'Recall'])
        for row in results.get('complete_plots', {}).get('accuracy', []):
            writer.writerow([
                row['x'], 
                row['accuracy'], 
                row['precision'], 
                row['recall']
            ])
        
        writer.writerow([])
        
        # Write performance data
        writer.writerow(['=== Performance Metrics ==='])
        writer.writerow(['Time', 'Throughput', 'Memory', 'CPU'])
        for row in results.get('complete_plots', {}).get('performance', []):
            writer.writerow([
                row['time'], 
                row['throughput'], 
                row['memory'], 
                row['cpu']
            ])
        
        # Create response
        response = Response(output.getvalue(), mimetype='text/csv')
        response.headers['Content-Disposition'] = \
            f'attachment; filename=plot_data_{task_id}.csv'
        return response
    
    elif format_type == 'json':
        # Return JSON (compressed if large)
        return compress_response(results.get('complete_plots', {}))
    
    else:
        return jsonify({'error': f'Unsupported format: {format_type}'}), 400

@bp.route('/results/<task_id>/page', methods=['GET'])
def get_results_page(task_id):
    """Get paginated results"""
    
    # Validate task ID
    if not validate_task_id(task_id):
        return jsonify({'error': 'Invalid task ID'}), 400
    
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    # Get results
    results = redis_service.get_task_results(task_id)
    if not results:
        return jsonify({'error': 'Results not found'}), 404
    
    # Get complete plot data
    all_data = results.get('complete_plots', {})
    
    # Paginate convergence data as example
    convergence_data = all_data.get('convergence', [])
    start = (page - 1) * per_page
    end = start + per_page
    page_data = convergence_data[start:end]
    
    return jsonify({
        'page': page,
        'per_page': per_page,
        'total': len(convergence_data),
        'data': page_data,
        'has_next': end < len(convergence_data),
        'has_prev': page > 1
    })