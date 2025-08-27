# app/utils/validators.py
"""Request validation utilities"""

def validate_calculation_params(data):
    """Validate calculation parameters"""
    errors = []
    
    if not data:
        return ['No data provided']
    
    # Validate num_iterations
    num_iterations = data.get('num_iterations')
    if num_iterations is None:
        errors.append('num_iterations is required')
    elif not isinstance(num_iterations, int):
        errors.append('num_iterations must be an integer')
    elif num_iterations < 1:
        errors.append('num_iterations must be at least 1')
    elif num_iterations > 1000:
        errors.append('num_iterations cannot exceed 1000')
    
    # Validate test_params if provided
    test_params = data.get('test_params', {})
    if not isinstance(test_params, dict):
        errors.append('test_params must be a dictionary')
    
    return errors

def validate_task_id(task_id):
    """Validate task ID format"""
    if not task_id:
        return False
    
    # Check for valid UUID format (Celery task IDs)
    import re
    uuid_pattern = re.compile(
        r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(task_id))


