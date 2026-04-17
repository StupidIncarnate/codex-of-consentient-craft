import { claudeLineNormalizeBroker } from './claude-line-normalize-broker';
import { claudeLineNormalizeBrokerProxy } from './claude-line-normalize-broker.proxy';

describe('claudeLineNormalizeBroker', () => {
  describe('snake_case JSON normalization (stdout shape)', () => {
    it('VALID: {rawLine with snake_case keys} => returns object with camelCase keys', () => {
      claudeLineNormalizeBrokerProxy();

      expect(
        claudeLineNormalizeBroker({
          rawLine: '{"type":"user","session_id":"abc-123","tool_use_result":{"agent_id":"a1"}}',
        }),
      ).toStrictEqual({
        type: 'user',
        sessionId: 'abc-123',
        toolUseResult: { agentId: 'a1' },
      });
    });

    it('VALID: {rawLine with nested message.content array of snake_case items} => recursively converts every key', () => {
      claudeLineNormalizeBrokerProxy();

      expect(
        claudeLineNormalizeBroker({
          rawLine:
            '{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_01","content":"output"}]}}',
        }),
      ).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', toolUseId: 'toolu_01', content: 'output' }],
        },
      });
    });
  });

  describe('camelCase JSON normalization (JSONL file shape)', () => {
    it('VALID: {rawLine with camelCase outer + snake_case inner content} => normalizes inner content too', () => {
      claudeLineNormalizeBrokerProxy();

      expect(
        claudeLineNormalizeBroker({
          rawLine:
            '{"sessionId":"abc","parentUuid":"p","isSidechain":false,"userType":"external","toolUseResult":{"agentId":"a1"},"message":{"content":[{"type":"tool_use","tool_use_id":"toolu_01"}]}}',
        }),
      ).toStrictEqual({
        sessionId: 'abc',
        parentUuid: 'p',
        isSidechain: false,
        userType: 'external',
        toolUseResult: { agentId: 'a1' },
        message: {
          content: [{ type: 'tool_use', toolUseId: 'toolu_01' }],
        },
      });
    });
  });

  describe('XML inflation in content fields', () => {
    it('VALID: {rawLine with task-notification XML in content} => inflates content into nested object', () => {
      claudeLineNormalizeBrokerProxy();

      expect(
        claudeLineNormalizeBroker({
          rawLine:
            '{"type":"user","message":{"role":"user","content":"<task-notification><task-id>t1</task-id><status>completed</status></task-notification>"}}',
        }),
      ).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: { taskNotification: { taskId: 't1', status: 'completed' } },
        },
      });
    });

    it('VALID: {rawLine with plain text content} => leaves content as string', () => {
      claudeLineNormalizeBrokerProxy();

      expect(
        claudeLineNormalizeBroker({
          rawLine: '{"type":"user","message":{"role":"user","content":"hello world"}}',
        }),
      ).toStrictEqual({
        type: 'user',
        message: { role: 'user', content: 'hello world' },
      });
    });
  });

  describe('parse failures', () => {
    it('ERROR: {rawLine: "not json"} => returns null', () => {
      claudeLineNormalizeBrokerProxy();

      expect(claudeLineNormalizeBroker({ rawLine: 'not json' })).toBe(null);
    });

    it('ERROR: {rawLine: ""} => returns null', () => {
      claudeLineNormalizeBrokerProxy();

      expect(claudeLineNormalizeBroker({ rawLine: '' })).toBe(null);
    });

    it('ERROR: {rawLine: "{broken"} => returns null', () => {
      claudeLineNormalizeBrokerProxy();

      expect(claudeLineNormalizeBroker({ rawLine: '{broken' })).toBe(null);
    });
  });

  describe('non-object JSON values', () => {
    it('VALID: {rawLine: "42"} => returns 42 (primitive passthrough)', () => {
      claudeLineNormalizeBrokerProxy();

      expect(claudeLineNormalizeBroker({ rawLine: '42' })).toBe(42);
    });

    it('VALID: {rawLine: "null"} => returns null (JSON null)', () => {
      claudeLineNormalizeBrokerProxy();

      expect(claudeLineNormalizeBroker({ rawLine: 'null' })).toBe(null);
    });
  });
});
