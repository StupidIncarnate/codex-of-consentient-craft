"""
ValidationService: Data validation service implementation
"""
import re
from typing import Any, Dict, List, Union
from datetime import datetime


class ValidationService:
    """ValidationService provides comprehensive data validation functionality"""
    
    def __init__(self):
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.phone_pattern = re.compile(r'^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$')
    
    def validate_input(self, data: Any, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        ValidationService validates input data against provided schema
        
        Args:
            data: Input data to validate
            schema: Validation schema definition
            
        Returns:
            Dict containing validation results and error details
        """
        errors = []
        warnings = []
        
        # Handle None or empty data
        if data is None:
            if schema.get('required', False):
                errors.append('ValidationService: Required field is missing')
            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'validated_data': data
            }
        
        # Type validation
        expected_type = schema.get('type')
        if expected_type:
            if not self._validate_type(data, expected_type):
                errors.append(f'ValidationService: Expected type {expected_type}, got {type(data).__name__}')
        
        # Format validation
        format_type = schema.get('format')
        if format_type and isinstance(data, str):
            format_error = self._validate_format(data, format_type)
            if format_error:
                errors.append(f'ValidationService: {format_error}')
        
        # Length validation
        min_length = schema.get('min_length')
        max_length = schema.get('max_length')
        if isinstance(data, (str, list, dict)):
            length = len(data)
            if min_length is not None and length < min_length:
                errors.append(f'ValidationService: Minimum length {min_length} required, got {length}')
            if max_length is not None and length > max_length:
                errors.append(f'ValidationService: Maximum length {max_length} exceeded, got {length}')
        
        # Range validation for numbers
        if isinstance(data, (int, float)):
            min_val = schema.get('minimum')
            max_val = schema.get('maximum')
            if min_val is not None and data < min_val:
                errors.append(f'ValidationService: Minimum value {min_val} required, got {data}')
            if max_val is not None and data > max_val:
                errors.append(f'ValidationService: Maximum value {max_val} exceeded, got {data}')
        
        # Enum validation
        allowed_values = schema.get('enum')
        if allowed_values and data not in allowed_values:
            errors.append(f'ValidationService: Value must be one of {allowed_values}, got {data}')
        
        # Pattern validation
        pattern = schema.get('pattern')
        if pattern and isinstance(data, str):
            if not re.match(pattern, data):
                errors.append(f'ValidationService: Pattern validation failed for {pattern}')
        
        # Custom validation rules
        custom_rules = schema.get('custom_rules', [])
        for rule in custom_rules:
            custom_error = self._apply_custom_rule(data, rule)
            if custom_error:
                errors.append(f'ValidationService: {custom_error}')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'validated_data': self._sanitize_data(data, schema) if len(errors) == 0 else data
        }
    
    def _validate_type(self, data: Any, expected_type: str) -> bool:
        """ValidationService validates data type"""
        type_mapping = {
            'string': str,
            'integer': int,
            'float': float,
            'boolean': bool,
            'list': list,
            'dict': dict,
            'datetime': datetime
        }
        
        expected_python_type = type_mapping.get(expected_type)
        if expected_python_type:
            return isinstance(data, expected_python_type)
        return True
    
    def _validate_format(self, data: str, format_type: str) -> Union[str, None]:
        """ValidationService validates string format"""
        if format_type == 'email':
            if not self.email_pattern.match(data):
                return 'Invalid email format'
        elif format_type == 'phone':
            if not self.phone_pattern.match(data):
                return 'Invalid phone number format'
        elif format_type == 'url':
            if not (data.startswith('http://') or data.startswith('https://')):
                return 'Invalid URL format'
        elif format_type == 'date':
            try:
                datetime.strptime(data, '%Y-%m-%d')
            except ValueError:
                return 'Invalid date format, expected YYYY-MM-DD'
        
        return None
    
    def _apply_custom_rule(self, data: Any, rule: Dict[str, Any]) -> Union[str, None]:
        """ValidationService applies custom validation rule"""
        rule_type = rule.get('type')
        
        if rule_type == 'no_whitespace' and isinstance(data, str):
            if ' ' in data:
                return 'Whitespace not allowed'
        elif rule_type == 'alphanumeric_only' and isinstance(data, str):
            if not data.isalnum():
                return 'Only alphanumeric characters allowed'
        elif rule_type == 'positive_number' and isinstance(data, (int, float)):
            if data <= 0:
                return 'Must be a positive number'
        
        return None
    
    def _sanitize_data(self, data: Any, schema: Dict[str, Any]) -> Any:
        """ValidationService sanitizes validated data"""
        if isinstance(data, str):
            # Trim whitespace if configured
            if schema.get('trim_whitespace', False):
                data = data.strip()
            
            # Convert to lowercase if configured
            if schema.get('lowercase', False):
                data = data.lower()
        
        return data


# Module-level function for external API compatibility
def validate_input(data: Any, schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    ValidationService: Main validation function for external use
    
    Args:
        data: Input data to validate
        schema: Validation schema definition
        
    Returns:
        Dict containing validation results and error details
    """
    validator = ValidationService()
    return validator.validate_input(data, schema)