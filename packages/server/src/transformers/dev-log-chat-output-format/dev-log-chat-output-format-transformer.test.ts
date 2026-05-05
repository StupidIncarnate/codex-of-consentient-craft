import { devLogChatOutputFormatTransformer } from './dev-log-chat-output-format-transformer';

describe('devLogChatOutputFormatTransformer', () => {
  it('VALID: {chat event with assistant text entries} => formats summary', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'Hello world',
            uuid: 'entry-uuid-1',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
    });

    expect(result).toBe('proc:abc12345  assistant/text  "Hello world"');
  });

  it('VALID: {pipeline event with slotIndex and tool_use entries} => shows slot and tool', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        processId: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82',
        slotIndex: 2,
        entries: [
          {
            role: 'assistant',
            type: 'tool_use',
            toolName: 'Read',
            toolInput: '{}',
            uuid: 'entry-uuid-1',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
    });

    expect(result).toBe('proc:1925f6f6  slot:2  assistant/tool_use  Read');
  });

  it('EDGE: {no entries field} => shows (no entries)', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
      },
    });

    expect(result).toBe('proc:abc12345  (no entries)');
  });

  it('EDGE: {empty entries array} => shows (no entries)', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
        entries: [],
      },
    });

    expect(result).toBe('proc:abc12345  (no entries)');
  });

  it('VALID: {multiple entries} => joins with " | "', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'hello',
            uuid: 'entry-uuid-1',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
          {
            role: 'assistant',
            type: 'thinking',
            content: 'thinking',
            uuid: 'entry-uuid-2',
            timestamp: '2025-01-01T00:00:01.000Z',
          },
        ],
      },
    });

    expect(result).toBe('proc:abc12345  assistant/text  "hello" | assistant/thinking');
  });
});
