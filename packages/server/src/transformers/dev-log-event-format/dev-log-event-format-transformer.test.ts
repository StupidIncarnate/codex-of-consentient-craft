import { devLogEventFormatTransformer } from './dev-log-event-format-transformer';

describe('devLogEventFormatTransformer', () => {
  describe('chat-output events', () => {
    it('VALID: {assistant tool_use entry} => shows tool name', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolName: 'Read',
              toolInput: '{"file_path":"/test"}',
              uuid: 'entry-uuid-1',
              timestamp: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      });

      expect(result).toBe('◂  chat-output  proc:e8c8ba78  assistant/tool_use  Read');
    });

    it('VALID: {assistant text entry} => shows truncated preview', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-99cf9441-9852-5274-a073-30f5c2eb07be',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'Let me read the file.',
              uuid: 'entry-uuid-1',
              timestamp: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      });

      expect(result).toBe('◂  chat-output  proc:99cf9441  assistant/text  "Let me read the file."');
    });

    it('VALID: {assistant thinking entry} => shows thinking label', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-99cf9441-9852-5274-a073-30f5c2eb07be',
          entries: [
            {
              role: 'assistant',
              type: 'thinking',
              content: 'reasoning here',
              uuid: 'entry-uuid-1',
              timestamp: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      });

      expect(result).toBe('◂  chat-output  proc:99cf9441  assistant/thinking');
    });

    it('VALID: {pipeline event with slotIndex} => shows slot label', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          processId: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82',
          slotIndex: 0,
          entries: [
            {
              role: 'assistant',
              type: 'tool_use',
              toolName: 'mcp__dungeonmaster__signal-back',
              toolInput: '{"questId":"abc"}',
              uuid: 'entry-uuid-1',
              timestamp: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      });

      expect(result).toBe(
        '◂  chat-output  proc:1925f6f6  slot:0  assistant/tool_use  mcp__dungeonmaster__signal-back',
      );
    });

    it('EDGE: {no entries field} => shows (no entries)', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-99cf9441-9852-5274-a073-30f5c2eb07be',
        },
      });

      expect(result).toBe('◂  chat-output  proc:99cf9441  (no entries)');
    });
  });
});
