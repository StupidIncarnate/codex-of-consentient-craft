import { devLogChatOutputFormatTransformer } from './dev-log-chat-output-format-transformer';

describe('devLogChatOutputFormatTransformer', () => {
  it('VALID: {chat event with line} => parses and formats inner JSONL', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
        line: JSON.stringify({ type: 'system', subtype: 'init' }),
      },
    });

    expect(result).toBe('proc:abc12345  system/init');
  });

  it('VALID: {pipeline event with entry.raw and slotIndex} => shows slot', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        processId: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82',
        slotIndex: 2,
        entry: {
          raw: JSON.stringify({ type: 'system', subtype: 'init' }),
        },
      },
    });

    expect(result).toBe('proc:1925f6f6  slot:2  system/init');
  });

  it('EDGE: {unparseable line} => shows unparseable', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
        line: 'not json',
      },
    });

    expect(result).toBe('proc:abc12345  (unparseable)');
  });

  it('EDGE: {no line or entry} => shows unparseable', () => {
    const result = devLogChatOutputFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
      },
    });

    expect(result).toBe('proc:abc12345  (unparseable)');
  });
});
