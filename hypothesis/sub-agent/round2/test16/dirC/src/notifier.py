"""
NotificationHandler: Notification delivery service implementation
"""
import json
import time
from typing import Dict, List, Any, Optional
from enum import Enum
from datetime import datetime
import uuid


class NotificationChannel(Enum):
    """NotificationHandler supported delivery channels"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBHOOK = "webhook"


class NotificationPriority(Enum):
    """NotificationHandler priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationHandler:
    """NotificationHandler provides multi-channel notification delivery"""
    
    def __init__(self):
        self.delivery_providers = {
            NotificationChannel.EMAIL: self._mock_email_provider,
            NotificationChannel.SMS: self._mock_sms_provider,
            NotificationChannel.PUSH: self._mock_push_provider,
            NotificationChannel.WEBHOOK: self._mock_webhook_provider
        }
        self.notification_history = []
        self.retry_config = {
            'max_attempts': 3,
            'backoff_seconds': [1, 5, 15]
        }
    
    def send_notification(self, 
                         recipient: str, 
                         message: str, 
                         channel: str = "email",
                         priority: str = "normal",
                         metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        NotificationHandler sends notification through specified channel
        
        Args:
            recipient: Notification recipient identifier
            message: Notification message content
            channel: Delivery channel (email, sms, push, webhook)
            priority: Notification priority level
            metadata: Additional notification metadata
            
        Returns:
            Dict containing delivery status and tracking information
        """
        # Generate unique notification ID
        notification_id = str(uuid.uuid4())
        
        # Validate inputs
        validation_result = self._validate_notification_request(
            recipient, message, channel, priority
        )
        if not validation_result['valid']:
            return {
                'success': False,
                'notification_id': notification_id,
                'error': validation_result['error'],
                'message': f'NotificationHandler: {validation_result["error"]}'
            }
        
        # Prepare notification payload
        notification_payload = {
            'id': notification_id,
            'recipient': recipient,
            'message': message,
            'channel': channel,
            'priority': priority,
            'metadata': metadata or {},
            'timestamp': datetime.now().isoformat(),
            'attempts': 0,
            'status': 'pending'
        }
        
        # Attempt delivery with retry logic
        delivery_result = self._attempt_delivery_with_retry(notification_payload)
        
        # Store in history for testing/debugging
        self.notification_history.append({
            **notification_payload,
            'delivery_result': delivery_result,
            'final_status': 'delivered' if delivery_result['success'] else 'failed'
        })
        
        return {
            'success': delivery_result['success'],
            'notification_id': notification_id,
            'channel': channel,
            'delivery_time': delivery_result.get('delivery_time'),
            'provider_response': delivery_result.get('provider_response'),
            'attempts': delivery_result.get('attempts', 0),
            'message': f'NotificationHandler: Notification {"delivered" if delivery_result["success"] else "failed"}'
        }
    
    def _validate_notification_request(self, recipient: str, message: str, 
                                     channel: str, priority: str) -> Dict[str, Any]:
        """NotificationHandler validates notification request parameters"""
        
        if not recipient or not isinstance(recipient, str):
            return {'valid': False, 'error': 'Invalid recipient'}
        
        if not message or not isinstance(message, str):
            return {'valid': False, 'error': 'Invalid message'}
        
        if channel not in [c.value for c in NotificationChannel]:
            return {'valid': False, 'error': f'Unsupported channel: {channel}'}
        
        if priority not in [p.value for p in NotificationPriority]:
            return {'valid': False, 'error': f'Invalid priority: {priority}'}
        
        # Channel-specific validation
        if channel == NotificationChannel.EMAIL.value:
            if '@' not in recipient:
                return {'valid': False, 'error': 'Invalid email format'}
        elif channel == NotificationChannel.SMS.value:
            if not recipient.replace('+', '').replace('-', '').replace(' ', '').isdigit():
                return {'valid': False, 'error': 'Invalid phone number format'}
        elif channel == NotificationChannel.WEBHOOK.value:
            if not recipient.startswith(('http://', 'https://')):
                return {'valid': False, 'error': 'Invalid webhook URL'}
        
        return {'valid': True}
    
    def _attempt_delivery_with_retry(self, notification_payload: Dict[str, Any]) -> Dict[str, Any]:
        """NotificationHandler attempts delivery with retry logic"""
        channel = NotificationChannel(notification_payload['channel'])
        provider = self.delivery_providers[channel]
        
        for attempt in range(self.retry_config['max_attempts']):
            notification_payload['attempts'] = attempt + 1
            
            try:
                # Attempt delivery through provider
                provider_result = provider(notification_payload)
                
                if provider_result['success']:
                    return {
                        'success': True,
                        'delivery_time': provider_result.get('delivery_time'),
                        'provider_response': provider_result.get('response'),
                        'attempts': attempt + 1
                    }
                
                # If not successful and not final attempt, wait before retry
                if attempt < self.retry_config['max_attempts'] - 1:
                    backoff_time = self.retry_config['backoff_seconds'][attempt]
                    time.sleep(backoff_time)
                
            except Exception as e:
                # Log error and continue to next attempt
                error_msg = f"NotificationHandler: Provider error on attempt {attempt + 1}: {str(e)}"
                if attempt == self.retry_config['max_attempts'] - 1:
                    return {
                        'success': False,
                        'error': error_msg,
                        'attempts': attempt + 1
                    }
        
        return {
            'success': False,
            'error': 'NotificationHandler: Max retry attempts exceeded',
            'attempts': self.retry_config['max_attempts']
        }
    
    def _mock_email_provider(self, notification_payload: Dict[str, Any]) -> Dict[str, Any]:
        """NotificationHandler mock email delivery provider"""
        # Simulate email delivery
        delivery_time = time.time()
        
        # Simulate occasional failures for testing
        if notification_payload['recipient'].endswith('fail.com'):
            return {
                'success': False,
                'response': 'Email delivery failed - invalid domain',
                'delivery_time': delivery_time
            }
        
        return {
            'success': True,
            'response': f'Email sent to {notification_payload["recipient"]}',
            'delivery_time': delivery_time,
            'message_id': f'email_{uuid.uuid4().hex[:8]}'
        }
    
    def _mock_sms_provider(self, notification_payload: Dict[str, Any]) -> Dict[str, Any]:
        """NotificationHandler mock SMS delivery provider"""
        delivery_time = time.time()
        
        # Simulate SMS delivery
        if notification_payload['recipient'].startswith('+1555'):
            return {
                'success': False,
                'response': 'SMS delivery failed - invalid number',
                'delivery_time': delivery_time
            }
        
        return {
            'success': True,
            'response': f'SMS sent to {notification_payload["recipient"]}',
            'delivery_time': delivery_time,
            'message_id': f'sms_{uuid.uuid4().hex[:8]}'
        }
    
    def _mock_push_provider(self, notification_payload: Dict[str, Any]) -> Dict[str, Any]:
        """NotificationHandler mock push notification provider"""
        delivery_time = time.time()
        
        return {
            'success': True,
            'response': f'Push notification sent to {notification_payload["recipient"]}',
            'delivery_time': delivery_time,
            'message_id': f'push_{uuid.uuid4().hex[:8]}'
        }
    
    def _mock_webhook_provider(self, notification_payload: Dict[str, Any]) -> Dict[str, Any]:
        """NotificationHandler mock webhook delivery provider"""
        delivery_time = time.time()
        
        # Simulate webhook call
        if 'timeout' in notification_payload['recipient']:
            return {
                'success': False,
                'response': 'Webhook delivery failed - timeout',
                'delivery_time': delivery_time
            }
        
        return {
            'success': True,
            'response': f'Webhook called: {notification_payload["recipient"]}',
            'delivery_time': delivery_time,
            'status_code': 200
        }
    
    def get_notification_history(self) -> List[Dict[str, Any]]:
        """NotificationHandler retrieves notification history for testing"""
        return self.notification_history.copy()
    
    def clear_history(self):
        """NotificationHandler clears notification history"""
        self.notification_history.clear()


# Module-level function for external API compatibility
def send_notification(recipient: str, 
                     message: str, 
                     channel: str = "email",
                     priority: str = "normal",
                     metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    NotificationHandler: Main notification function for external use
    
    Args:
        recipient: Notification recipient identifier
        message: Notification message content
        channel: Delivery channel (email, sms, push, webhook)
        priority: Notification priority level
        metadata: Additional notification metadata
        
    Returns:
        Dict containing delivery status and tracking information
    """
    handler = NotificationHandler()
    return handler.send_notification(recipient, message, channel, priority, metadata)