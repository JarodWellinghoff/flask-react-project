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

def validate_batch_params(data):
    """Validate batch calculation parameters"""
    errors = []
    
    if not data:
        return ['No data provided']
    
    batch_config = data.get('batch_config', {})
    if not isinstance(batch_config, dict):
        errors.append('batch_config must be a dictionary')
        return errors
    
    tests = batch_config.get('tests', [])
    if not isinstance(tests, list):
        errors.append('tests must be a list')
    elif len(tests) == 0:
        errors.append('At least one test configuration is required')
    elif len(tests) > 10:  # Reasonable limit
        errors.append('Maximum 10 tests allowed per batch')
    
    # Validate each test configuration
    for i, test in enumerate(tests):
        if not isinstance(test, dict):
            errors.append(f'Test {i+1} configuration must be a dictionary')
            continue
            
        # Validate num_iterations for each test
        num_iterations = test.get('num_iterations')
        if num_iterations is None:
            errors.append(f'Test {i+1}: num_iterations is required')
        elif not isinstance(num_iterations, int):
            errors.append(f'Test {i+1}: num_iterations must be an integer')
        elif num_iterations < 1:
            errors.append(f'Test {i+1}: num_iterations must be at least 1')
        elif num_iterations > 100:
            errors.append(f'Test {i+1}: num_iterations cannot exceed 100')
        
        # Validate test_params if provided
        test_params = test.get('test_params', {})
        if not isinstance(test_params, dict):
            errors.append(f'Test {i+1}: test_params must be a dictionary')
    
    return errors
