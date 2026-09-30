import { wrapPostToolUseOutputTransformer } from './wrap-post-tool-use-output-transformer';

describe('wrapPostToolUseOutputTransformer', () => {
  it('VALID: {content: "gateway-sync added left-pad"} => returns PostToolUse JSON with additionalContext', () => {
    const result = wrapPostToolUseOutputTransformer({ content: 'gateway-sync added left-pad' });

    expect(result).toBe(
      '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"gateway-sync added left-pad"}}',
    );
  });

  it('VALID: {content: multi-line with quotes} => returns JSON with the text escaped intact', () => {
    const result = wrapPostToolUseOutputTransformer({ content: 'line one\n"quoted" line two' });

    expect(JSON.parse(result)).toStrictEqual({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: 'line one\n"quoted" line two',
      },
    });
  });

  it('EMPTY: {content: ""} => returns JSON with empty additionalContext', () => {
    const result = wrapPostToolUseOutputTransformer({ content: '' });

    expect(result).toBe(
      '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":""}}',
    );
  });
});
