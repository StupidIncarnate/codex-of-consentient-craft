import { commandOutputToChatEntriesTransformer } from './command-output-to-chat-entries-transformer';
import { commandOutputToChatEntriesTransformerProxy } from './command-output-to-chat-entries-transformer.proxy';

const FIXED_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

describe('commandOutputToChatEntriesTransformer', () => {
  describe('plain output', () => {
    it('VALID: {text: one line} => returns one assistant-text entry carrying it', () => {
      const proxy = commandOutputToChatEntriesTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });

      const result = commandOutputToChatEntriesTransformer({ text: '— base branch: master —' });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: '— base branch: master —',
          uuid: FIXED_UUID,
          timestamp: FIXED_TIMESTAMP,
        },
      ]);
    });
  });

  describe('ward progress redraws', () => {
    it('VALID: {text: a running line overwritten by its result} => returns one entry per line, codes removed', () => {
      const proxy = commandOutputToChatEntriesTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });

      const result = commandOutputToChatEntriesTransformer({
        text: 'typecheck   @dungeonmaster/cli   running...\r\u001b[Ktypecheck   @dungeonmaster/cli   PASS  241 files, 241 discovered (14.1s)\n\n\r\u001b[K\n',
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'typecheck   @dungeonmaster/cli   running...',
          uuid: FIXED_UUID,
          timestamp: FIXED_TIMESTAMP,
        },
        {
          role: 'assistant',
          type: 'text',
          content: 'typecheck   @dungeonmaster/cli   PASS  241 files, 241 discovered (14.1s)',
          uuid: FIXED_UUID,
          timestamp: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('EMPTY: {text: only an erase-line redraw} => returns no entries', () => {
      const proxy = commandOutputToChatEntriesTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });

      const result = commandOutputToChatEntriesTransformer({ text: '\r\u001b[K\n' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {text: ""} => returns no entries', () => {
      const proxy = commandOutputToChatEntriesTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });

      const result = commandOutputToChatEntriesTransformer({ text: '' });

      expect(result).toStrictEqual([]);
    });
  });
});
