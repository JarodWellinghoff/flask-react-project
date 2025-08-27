# app/api/acknowledgments.py
"""Message acknowledgment endpoints"""
from flask import Blueprint, jsonify, request
from app.services.redis_service import RedisService
from app.utils.validators import validate_task_id
import logging

logger = logging.getLogger(__name__)
bp = Blueprint('acknowledgments', __name__)
redis_service = RedisService()

@bp.route('/ack/<task_id>', methods=['POST'])
def acknowledge_message(task_id):
    """Acknowledge receipt of a message"""
    
    # Validate task ID
    if not validate_task_id(task_id):
        return jsonify({'error': 'Invalid task ID'}), 400
    
    data = request.json
    if not data or 'message_id' not in data:
        return jsonify({'error': 'message_id is required'}), 400
    
    message_id = data['message_id']
    
    # Store the acknowledgment
    redis_service.store_message_ack(task_id, message_id)
    
    logger.debug(f"Acknowledged message {message_id} for task {task_id}")
    
    return jsonify({
        'status': 'acknowledged',
        'task_id': task_id,
        'message_id': message_id
    })

@bp.route('/ack-status/<task_id>/<message_id>', methods=['GET']) 
def check_acknowledgment_status(task_id, message_id):
    """Check if a message has been acknowledged (for debugging)"""
    
    if not validate_task_id(task_id):
        return jsonify({'error': 'Invalid task ID'}), 400
    
    acknowledged = redis_service.get_message_ack(task_id, message_id)
    
    return jsonify({
        'task_id': task_id,
        'message_id': message_id,
        'acknowledged': acknowledged
    })