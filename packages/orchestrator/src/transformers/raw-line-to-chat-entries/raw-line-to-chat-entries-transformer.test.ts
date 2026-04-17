import { rawLineToChatEntriesTransformer } from './raw-line-to-chat-entries-transformer';

describe('rawLineToChatEntriesTransformer', () => {
  describe('plain-text fallback (parsed: null)', () => {
    it('VALID: {parsed: null, rawLine: ward output} => returns single assistant-text entry', () => {
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
        },
      ]);
    });

    it('EMPTY: {parsed: null, rawLine: ""} => returns empty array', () => {
      expect(rawLineToChatEntriesTransformer({ parsed: null, rawLine: '' })).toStrictEqual([]);
    });
  });

  describe('normalized Claude line (parsed object)', () => {
    it('VALID: {parsed: assistant text line} => returns ChatEntry[] from streamJsonToChatEntry', () => {
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
