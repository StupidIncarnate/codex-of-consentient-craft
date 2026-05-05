import { rawLineToChatEntriesTransformer } from './raw-line-to-chat-entries-transformer';
import { rawLineToChatEntriesTransformerProxy } from './raw-line-to-chat-entries-transformer.proxy';

const UUID1 = '00000000-0000-4000-8000-000000000001';
const TS = '2025-01-01T00:00:00.000Z';

describe('rawLineToChatEntriesTransformer', () => {
  describe('plain-text fallback (parsed: null)', () => {
    it('VALID: {parsed: null, rawLine: ward output} => returns single assistant-text entry', () => {
      const proxy = rawLineToChatEntriesTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      proxy.setupTimestamps({ timestamps: [TS] });

      expect(
        rawLineToChatEntriesTransformer({
          parsed: null,
          rawLine: 'lint @dungeonmaster/shared PASS  42 files',
        }),
      ).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'lint @dungeonmaster/shared PASS  42 files',
          uuid: UUID1,
          timestamp: TS,
        },
      ]);
    });

    it('EMPTY: {parsed: null, rawLine: ""} => returns empty array', () => {
      expect(rawLineToChatEntriesTransformer({ parsed: null, rawLine: '' })).toStrictEqual([]);
    });
  });

  describe('normalized Claude line (parsed object)', () => {
    it('VALID: {parsed: assistant text line} => returns ChatEntry[] from streamJsonToChatEntry', () => {
      const proxy = rawLineToChatEntriesTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });

      expect(
        rawLineToChatEntriesTransformer({
          parsed: {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Hello' }],
            },
          },
          rawLine: '{"type":"assistant",...}',
        }),
      ).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'Hello',
          uuid: `${UUID1}:0`,
          timestamp: '1970-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('EMPTY: {parsed: system init line} => returns empty array (no entries)', () => {
      expect(
        rawLineToChatEntriesTransformer({
          parsed: { type: 'system', subtype: 'init', sessionId: 'abc' },
          rawLine: '{"type":"system","subtype":"init","session_id":"abc"}',
        }),
      ).toStrictEqual([]);
    });
  });
});
