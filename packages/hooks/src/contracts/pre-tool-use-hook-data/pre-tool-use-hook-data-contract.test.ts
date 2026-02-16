import { preToolUseHookDataContract } from './pre-tool-use-hook-data-contract';
import { PreToolUseHookStub } from './pre-tool-use-hook-data.stub';

describe('preToolUseHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = PreToolUseHookStub();

    expect(result).toStrictEqual({
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: process.cwd(),
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: {
        file_path: '/test/file.ts',
        content: '',
      },
    });
  });

  it('VALID: {Edit tool} => parses successfully', () => {
    const result = PreToolUseHookStub({
      tool_name: 'Edit',
    });

    expect(result.tool_name).toBe('Edit');
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return preToolUseHookDataContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
