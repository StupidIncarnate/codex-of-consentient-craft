import { snakeKeysToCamelKeysTransformer } from './snake-keys-to-camel-keys-transformer';

describe('snakeKeysToCamelKeysTransformer', () => {
  describe('object key conversion', () => {
    it('VALID: {tool_use_id: "x"} => returns {toolUseId: "x"}', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: { tool_use_id: 'x' } })).toStrictEqual({
        toolUseId: 'x',
      });
    });

    it('VALID: {session_id: "abc", parent_uuid: "p"} => converts every key', () => {
      expect(
        snakeKeysToCamelKeysTransformer({
          value: { session_id: 'abc', parent_uuid: 'p' },
        }),
      ).toStrictEqual({ sessionId: 'abc', parentUuid: 'p' });
    });

    it('VALID: {alreadyCamel: 1} => leaves camelCase keys unchanged', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: { alreadyCamel: 1 } })).toStrictEqual({
        alreadyCamel: 1,
      });
    });

    it('VALID: {single: "v"} => leaves single-word keys unchanged', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: { single: 'v' } })).toStrictEqual({
        single: 'v',
      });
    });

    it('VALID: {parent_uuid_2: "v"} => converts numeric segments', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: { parent_uuid_2: 'v' } })).toStrictEqual({
        parentUuid2: 'v',
      });
    });
  });

  describe('nested objects', () => {
    it('VALID: {message: {input_tokens: 5}} => recurses into nested objects', () => {
      expect(
        snakeKeysToCamelKeysTransformer({
          value: { message: { input_tokens: 5 } },
        }),
      ).toStrictEqual({ message: { inputTokens: 5 } });
    });

    it('VALID: deeply nested object => converts every level', () => {
      expect(
        snakeKeysToCamelKeysTransformer({
          value: {
            tool_use_result: {
              agent_id: 'a',
              nested_field: { deep_key: 'd' },
            },
          },
        }),
      ).toStrictEqual({
        toolUseResult: {
          agentId: 'a',
          nestedField: { deepKey: 'd' },
        },
      });
    });
  });

  describe('arrays', () => {
    it('VALID: [{tool_use_id: "x"}] => recurses into array items', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: [{ tool_use_id: 'x' }] })).toStrictEqual([
        { toolUseId: 'x' },
      ]);
    });

    it('VALID: nested arrays of objects => converts all keys', () => {
      expect(
        snakeKeysToCamelKeysTransformer({
          value: {
            content: [
              { type: 'tool_use', tool_use_id: 'a' },
              { type: 'text', text_value: 'hi' },
            ],
          },
        }),
      ).toStrictEqual({
        content: [
          { type: 'tool_use', toolUseId: 'a' },
          { type: 'text', textValue: 'hi' },
        ],
      });
    });

    it('VALID: array of primitives => returns array unchanged', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: [1, 'two', true] })).toStrictEqual([
        1,
        'two',
        true,
      ]);
    });
  });

  describe('primitives and null', () => {
    it('VALID: "snake_string" value => string is unchanged (only keys convert)', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: 'snake_string' })).toBe('snake_string');
    });

    it('VALID: 42 => returns 42', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: 42 })).toBe(42);
    });

    it('VALID: true => returns true', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: true })).toBe(true);
    });

    it('EMPTY: null => returns null', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: null })).toBe(null);
    });

    it('EMPTY: undefined => returns undefined', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: undefined })).toBe(undefined);
    });
  });

  describe('empty containers', () => {
    it('EMPTY: {} => returns {}', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: {} })).toStrictEqual({});
    });

    it('EMPTY: [] => returns []', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: [] })).toStrictEqual([]);
    });
  });

  describe('kebab-case keys (XML tag names)', () => {
    it('VALID: {"task-id": "t1"} => returns {taskId: "t1"}', () => {
      expect(snakeKeysToCamelKeysTransformer({ value: { 'task-id': 't1' } })).toStrictEqual({
        taskId: 't1',
      });
    });

    it('VALID: {"task-notification": {"task-id": "t1"}} => converts nested kebab keys', () => {
      expect(
        snakeKeysToCamelKeysTransformer({
          value: { 'task-notification': { 'task-id': 't1' } },
        }),
      ).toStrictEqual({ taskNotification: { taskId: 't1' } });
    });

    it('VALID: mixed kebab and snake keys => both convert to camelCase', () => {
      expect(
        snakeKeysToCamelKeysTransformer({
          value: { 'task-id': 't1', tool_use_id: 'u1' },
        }),
      ).toStrictEqual({ taskId: 't1', toolUseId: 'u1' });
    });
  });

  describe('Claude CLI shapes', () => {
    it('VALID: realistic JSONL line shape => converts every nested key', () => {
      expect(
        snakeKeysToCamelKeysTransformer({
          value: {
            type: 'user',
            session_id: 'abc-123',
            parent_uuid: 'p-1',
            tool_use_result: { agent_id: 'agent-x' },
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'toolu_01',
                  content: 'output',
                },
              ],
            },
          },
        }),
      ).toStrictEqual({
        type: 'user',
        sessionId: 'abc-123',
        parentUuid: 'p-1',
        toolUseResult: { agentId: 'agent-x' },
        message: {
          role: 'user',
          content: [{ type: 'tool_result', toolUseId: 'toolu_01', content: 'output' }],
        },
      });
    });
  });
});
