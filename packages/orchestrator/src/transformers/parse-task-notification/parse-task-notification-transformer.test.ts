import { parseTaskNotificationTransformer } from './parse-task-notification-transformer';

describe('parseTaskNotificationTransformer', () => {
  describe('valid notifications', () => {
    it('VALID: {content with all fields} => returns full structured data', () => {
      const content = [
        '<task-notification>',
        '<task-id>acfc7f06a8ac21baf</task-id>',
        '<tool-use-id>toolu_01R7DU7d8xnhW2pSnw3T9bbx</tool-use-id>',
        '<status>completed</status>',
        '<summary>Agent "background sub-agent" completed</summary>',
        '<result>Made both MCP calls successfully.</result>',
        '<usage><total_tokens>28054</total_tokens><tool_uses>3</tool_uses><duration_ms>9033</duration_ms></usage>',
        '</task-notification>',
      ].join('\n');

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toStrictEqual({
        taskId: 'acfc7f06a8ac21baf',
        status: 'completed',
        summary: 'Agent "background sub-agent" completed',
        result: 'Made both MCP calls successfully.',
        totalTokens: 28054,
        toolUses: 3,
        durationMs: 9033,
      });
    });

    it('VALID: {content with only taskId + status} => returns minimal data', () => {
      const content =
        '<task-notification><task-id>task-456</task-id><status>running</status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toStrictEqual({
        taskId: 'task-456',
        status: 'running',
      });
    });

    it('VALID: {multiline result} => captures full result with newlines', () => {
      const content = [
        '<task-notification>',
        '<task-id>task-ml</task-id>',
        '<status>completed</status>',
        '<result>line1',
        'line2',
        'line3</result>',
        '</task-notification>',
      ].join('\n');

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toStrictEqual({
        taskId: 'task-ml',
        status: 'completed',
        result: 'line1\nline2\nline3',
      });
    });
  });

  describe('invalid notifications', () => {
    it('EMPTY: {no taskId} => returns null', () => {
      const content = '<task-notification><status>completed</status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBe(null);
    });

    it('EMPTY: {no status} => returns null', () => {
      const content = '<task-notification><task-id>task-abc</task-id></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBe(null);
    });

    it('EMPTY: {empty taskId} => returns null', () => {
      const content =
        '<task-notification><task-id></task-id><status>completed</status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBe(null);
    });

    it('EMPTY: {empty status} => returns null', () => {
      const content =
        '<task-notification><task-id>task-abc</task-id><status></status></task-notification>';

      const result = parseTaskNotificationTransformer({ content });

      expect(result).toBe(null);
    });

    it('EMPTY: {unrelated text} => returns null', () => {
      const result = parseTaskNotificationTransformer({ content: 'just a user message' });

      expect(result).toBe(null);
    });
  });
});
