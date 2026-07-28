import { notificationMessageContract } from './notification-message-contract';
import { NotificationMessageStub } from './notification-message.stub';

describe('notificationMessageContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "Dropped 1 queued comment"} => parses the message', () => {
      const result = notificationMessageContract.parse('Dropped 1 queued comment');

      expect(result).toBe('Dropped 1 queued comment');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const result = notificationMessageContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => notificationMessageContract.parse(123)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates the default notification message', () => {
      const result = NotificationMessageStub();

      expect(result).toBe('Notification message');
    });

    it('VALID: {value: "custom"} => creates with custom value', () => {
      const result = NotificationMessageStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});
