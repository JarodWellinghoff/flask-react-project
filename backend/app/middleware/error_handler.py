# app/middleware/error_handler.py
"""Global error handling middleware"""
from flask import jsonify
from werkzeug.exceptions import HTTPException
import logging

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    """Register error handlers with Flask app"""
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle HTTP exceptions"""
        logger.warning(f'HTTP error: {e.code} - {e.description}')
        return jsonify({
            'error': e.description,
            'code': e.code
        }), e.code
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle unexpected exceptions"""
        logger.error(f'Unexpected error: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'An unexpected error occurred',
            'message': str(e) if app.config.get('DEBUG') else None
        }), 500
    
    @app.errorhandler(404)
    def handle_404(e):
        """Handle 404 errors"""
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(405)
    def handle_405(e):
        """Handle method not allowed"""
        return jsonify({'error': 'Method not allowed'}), 405
