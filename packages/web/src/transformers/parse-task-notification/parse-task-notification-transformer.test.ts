import { parseTaskNotificationTransformer } from './parse-task-notification-transformer';
import { parseTaskNotificationTransformerProxy } from './parse-task-notification-transformer.proxy';

describe('parseTaskNotificationTransformer', () => {
  describe('valid notifications', () => {
    it('VALID: {content with all fields} => returns full task notification entry', () => {
      parseTaskNotificationTransformerProxy();
      const content = [
        '<task-notification>',
        '<task-id>task-123</task-id>',
        '<status>completed</status>',
        '<summary>Agent finished reading files</summary>',
        '<result>Found 3 files matching pattern</result>',
        '<total_tokens>5000</total_tokens>',
        '<tool_uses>12</tool_uses>',
        '<duration_ms>45000</duration_ms>',
        '</task-notification>',
      ].join('');

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toStrictEqual({
        role: 'system',
        type: 'task_notification',
        taskId: 'task-123',
        status: 'completed',
        summary: 'Agent finished reading files',
        result: 'Found 3 files matching pattern',
        totalTokens: 5000,
        toolUses: 12,
        durationMs: 45000,
      });
    });

    it('VALID: {content with only required fields} => returns entry with taskId and status only', () => {
      parseTaskNotificationTransformerProxy();
      const content =
        '<task-notification><task-id>task-456</task-id><status>running</status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toStrictEqual({
        role: 'system',
        type: 'task_notification',
        taskId: 'task-456',
        status: 'running',
      });
    });

    it('VALID: {content with multiline result} => captures multiline result content', () => {
      parseTaskNotificationTransformerProxy();
      const content = [
        '<task-notification>',
        '<task-id>task-789</task-id>',
        '<status>completed</status>',
        '<result>Line one\nLine two\nLine three</result>',
        '</task-notification>',
      ].join('');

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toStrictEqual({
        role: 'system',
        type: 'task_notification',
        taskId: 'task-789',
        status: 'completed',
        result: 'Line one\nLine two\nLine three',
      });
    });
  });

  describe('invalid notifications', () => {
    it('EMPTY: {content missing task-id} => returns null', () => {
      parseTaskNotificationTransformerProxy();
      const content = '<task-notification><status>completed</status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBeNull();
    });

    it('EMPTY: {content missing status} => returns null', () => {
      parseTaskNotificationTransformerProxy();
      const content = '<task-notification><task-id>task-123</task-id></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBeNull();
    });

    it('EMPTY: {content with empty task-id} => returns null', () => {
      parseTaskNotificationTransformerProxy();
      const content =
        '<task-notification><task-id></task-id><status>completed</status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBeNull();
    });

    it('EMPTY: {content with empty status} => returns null', () => {
      parseTaskNotificationTransformerProxy();
      const content =
        '<task-notification><task-id>task-123</task-id><status></status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBeNull();
    });

    it('EMPTY: {content is plain text} => returns null', () => {
      parseTaskNotificationTransformerProxy();
      const content = 'This is just a regular message';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBeNull();
    });
  });
});
