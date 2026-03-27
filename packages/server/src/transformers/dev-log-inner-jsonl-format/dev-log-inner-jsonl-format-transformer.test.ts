import { devLogInnerJsonlFormatTransformer } from './dev-log-inner-jsonl-format-transformer';

describe('devLogInnerJsonlFormatTransformer', () => {
  it('VALID: {system/init} => returns system/init', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: { type: 'system', subtype: 'init' },
    });

    expect(result).toBe('system/init');
  });

  it('VALID: {system/hook_started with hook_id} => returns hook short ID', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: {
        type: 'system',
        subtype: 'hook_started',
        hook_id: '9c526043-eaa4-4f13-8bf4-b258db964f6b',
      },
    });

    expect(result).toBe('system/hook_started  hook:9c526043');
  });

  it('VALID: {system/turn_duration} => returns duration', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: { type: 'system', subtype: 'turn_duration', durationMs: 11054 },
    });

    expect(result).toBe('system/turn_duration  11054ms');
  });

  it('VALID: {assistant/tool_use} => returns tool name and detail', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'Grep',
              input: { pattern: 'processId' },
            },
          ],
        },
      },
    });

    expect(result).toBe('assistant/tool_use  Grep  pattern:"processId"');
  });

  it('VALID: {assistant/text} => returns text preview', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: {
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'Hello world' }] },
      },
    });

    expect(result).toBe('assistant/text  "Hello world"');
  });

  it('VALID: {user/tool_result ok} => returns ok status', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: {
        type: 'user',
        message: {
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_01abcdef-1111-2222-3333-444444444444',
              is_error: false,
            },
          ],
        },
      },
    });

    expect(result).toBe('user/tool_result  01abcdef  ok');
  });

  it('VALID: {rate_limit_event} => returns rate_limit status', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: {
        type: 'rate_limit_event',
        rate_limit_info: { status: 'allowed' },
      },
    });

    expect(result).toBe('rate_limit  allowed');
  });

  it('VALID: {progress/hook_progress} => returns hook name', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: {
        type: 'progress',
        data: { type: 'hook_progress', hookName: 'SessionStart:clear' },
      },
    });

    expect(result).toBe('progress/hook_progress  SessionStart:clear');
  });

  it('EDGE: {unknown type} => returns raw type string', () => {
    const result = devLogInnerJsonlFormatTransformer({
      parsed: { type: 'file-history-snapshot' },
    });

    expect(result).toBe('file-history-snapshot');
  });
});
