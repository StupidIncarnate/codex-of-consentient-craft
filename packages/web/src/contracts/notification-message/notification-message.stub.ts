import { notificationMessageContract } from './notification-message-contract';
import type { NotificationMessage } from './notification-message-contract';

export const NotificationMessageStub = ({ value }: { value?: string } = {}): NotificationMessage =>
  notificationMessageContract.parse(value ?? 'Notification message');
