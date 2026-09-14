import {
  PermissionDeniedStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  MixedTextAndToolResultStreamLineStub,
  TextOnlyUserStreamLineStub,
  UserTextArrayStreamLineStub,
  UserTextMultiBlockStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';
import { parseUserStreamEntryTransformer } from './parse-user-stream-entry-transformer';
import { parseUserStreamEntryTransformerProxy } from './parse-user-stream-entry-transformer.proxy';

const normalize = (value: unknown): object => snakeKeysToCamelKeysTransformer({ value }) as object;

const UUID1 = '00000000-0000-4000-8000-000000000001';
const TS = '1970-01-01T00:00:00.000Z';
const BASE_URL = 'http://dungeonmaster.localhost:3737';
const PASTED_IMAGE_LINE = 'A![Pasted Image 1](/p/x.png)B';
const REWRITTEN_PASTED_IMAGE_LINE =
  'A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B';

describe('parseUserStreamEntryTransformer', () => {
  describe('tool_result content', () => {
    it('VALID: {permission denied tool result} => returns tool result entry with isError', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(PermissionDeniedStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
          content:
            "Claude requested permissions to use mcp__dungeonmaster__list-guilds, but you haven't granted it yet.",
          isError: true,
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('VALID: {successful tool result} => returns tool result entry without isError', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(SuccessfulToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
          content: 'File contents retrieved successfully',
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('VALID: {mixed text and tool result} => only returns tool_result entries', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(MixedTextAndToolResultStreamLineStub()),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_015sb5Rz8yPMN4sbwdNaz8kk',
          content: 'Read 42 lines from file',
          uuid: `${UUID1}:1`,
          timestamp: TS,
        },
      ]);
    });
  });

  describe('toolUseResult.totalDurationMs lift', () => {
    it('VALID: {toolUseResult object reporting totalDurationMs: 59965} => stamps durationMs on the tool_result entry', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_task', content: 'Committed.' }],
          },
          toolUseResult: { agentId: 'af8a13db', status: 'completed', totalDurationMs: 59965 },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_task',
          content: 'Committed.',
          durationMs: 59965,
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('EDGE: {totalDurationMs: 59965.7} => truncates to 59965 rather than failing the integer contract', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_task', content: 'done' }],
          },
          toolUseResult: { totalDurationMs: 59965.7 },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_task',
          content: 'done',
          durationMs: 59965,
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('EDGE: {totalDurationMs: -5} => floors at 0 rather than failing the nonnegative contract', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_task', content: 'done' }],
          },
          toolUseResult: { totalDurationMs: -5 },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_task',
          content: 'done',
          durationMs: 0,
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('EMPTY: {toolUseResult object with no totalDurationMs} => omits durationMs', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_task', content: 'launched' }],
          },
          toolUseResult: { agentId: 'af8a13db', status: 'pending' },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_task',
          content: 'launched',
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('EMPTY: {toolUseResult is an array} => omits durationMs', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_bash', content: 'ok' }],
          },
          toolUseResult: [{ type: 'text', text: 'ok' }],
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_bash',
          content: 'ok',
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });

    it('EMPTY: {toolUseResult is a tool-error string} => omits durationMs', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_read', content: 'too big' }],
          },
          toolUseResult: 'Error: File content (30000 tokens) exceeds the limit',
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_read',
          content: 'too big',
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });
  });

  describe('source and agentId propagation', () => {
    it('VALID: {entry with source and agentId} => propagates to tool_result entries', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          source: 'session',
          agentId: 'agent-42',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 'toolu_abc', content: 'done' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_abc',
          content: 'done',
          source: 'session',
          agentId: 'agent-42',
          uuid: `${UUID1}:0`,
          timestamp: TS,
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {no message field} => returns empty array', () => {
      const stub = normalize(TextOnlyUserStreamLineStub());
      Reflect.deleteProperty(stub, 'message');

      const result = parseUserStreamEntryTransformer({ parsed: stub });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {message is null} => returns empty array', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: { type: 'user', message: null },
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {content is plain string} => returns user entry', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: 'plain string without tool results' },
          }),
        ),
      });

      expect(result).toStrictEqual([
        {
          role: 'user',
          content: 'plain string without tool results',
          uuid: `${UUID1}:user`,
          timestamp: TS,
        },
      ]);
    });

    it('EDGE: {text only user message with array content} => returns empty array', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(TextOnlyUserStreamLineStub()),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {user text single-block array via textBlockParamContract} => returns empty array', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(UserTextArrayStreamLineStub()),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {user text multi-block array} => returns empty array, all text blocks filtered', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(UserTextMultiBlockStreamLineStub()),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {content array has null item} => skips null items', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [null, { type: 'tool_result', tool_use_id: 'toolu_abc', content: 'data' }],
          },
        }),
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_abc',
          content: 'data',
          uuid: `${UUID1}:1`,
          timestamp: TS,
        },
      ]);
    });

    it('EDGE: {content item without type field} => skips item', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ tool_use_id: 'toolu_abc', content: 'data' }],
          },
        }),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {content item with non-tool_result type} => skips non-tool_result items', () => {
      const result = parseUserStreamEntryTransformer({
        parsed: normalize({
          type: 'user',
          message: {
            content: [{ type: 'text', text: 'hello' }],
          },
        }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('serverBaseUrl image path rewriting', () => {
    it('VALID: check-user-line-yields-one-entry: {content: pasted-image token, serverBaseUrl supplied} => parses to exactly one chat entry with role user', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: PASTED_IMAGE_LINE },
          }),
        ),
        serverBaseUrl: BASE_URL,
      });

      expect(result).toStrictEqual([
        {
          role: 'user',
          content: REWRITTEN_PASTED_IMAGE_LINE,
          uuid: `${UUID1}:user`,
          timestamp: TS,
        },
      ]);
    });

    it('VALID: {content carries an image token, serverBaseUrl supplied} => returned entry content is the rewritten URL string', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: PASTED_IMAGE_LINE },
          }),
        ),
        serverBaseUrl: BASE_URL,
      });

      expect(result[0]).toStrictEqual({
        role: 'user',
        content: REWRITTEN_PASTED_IMAGE_LINE,
        uuid: `${UUID1}:user`,
        timestamp: TS,
      });
    });

    it('EDGE: {content carries an image token, serverBaseUrl omitted} => content comes back byte-identical to the raw string', () => {
      const proxy = parseUserStreamEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = parseUserStreamEntryTransformer({
        parsed: normalize(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: PASTED_IMAGE_LINE },
          }),
        ),
      });

      expect(result[0]).toStrictEqual({
        role: 'user',
        content: PASTED_IMAGE_LINE,
        uuid: `${UUID1}:user`,
        timestamp: TS,
      });
    });
  });
});
