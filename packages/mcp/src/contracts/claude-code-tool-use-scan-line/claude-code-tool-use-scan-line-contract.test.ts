import { claudeCodeToolUseScanLineContract } from './claude-code-tool-use-scan-line-contract';
import { ClaudeCodeToolUseScanLineStub } from './claude-code-tool-use-scan-line.stub';

describe('claudeCodeToolUseScanLineContract', () => {
  it('VALID: {stub default shape} => parses successfully', () => {
    const stub = ClaudeCodeToolUseScanLineStub();
    const parsed = claudeCodeToolUseScanLineContract.safeParse(stub);

    expect(parsed.success).toBe(true);
  });

  it('VALID: {line with no message field} => parses (message is optional)', () => {
    const parsed = claudeCodeToolUseScanLineContract.safeParse({
      type: 'summary',
      other: 'fields',
    });

    expect(parsed.success).toBe(true);
  });

  it('VALID: {message.content with mixed tool_use and text items} => parses and preserves the array length', () => {
    const parsed = claudeCodeToolUseScanLineContract.parse({
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'hello' },
          { type: 'tool_use', id: 'toolu_abc', name: 'foo' },
        ],
      },
    });

    expect(parsed.message?.content?.length).toBe(2);
  });

  it('VALID: {unknown extra top-level field} => passes through via passthrough', () => {
    const parsed = claudeCodeToolUseScanLineContract.safeParse({
      unknownField: 'unexpected',
    });

    expect(parsed.success).toBe(true);
  });

  it('ERROR: {message.content has wrong shape (object instead of array)} => fails parse', () => {
    const parsed = claudeCodeToolUseScanLineContract.safeParse({
      message: { content: { not: 'an array' } },
    });

    expect(parsed.success).toBe(false);
  });
});
