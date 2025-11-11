import { hookDataContract } from './hook-data-contract';
import { HookDataStub } from './hook-data.stub';

describe('hookDataContract', () => {
  it('VALID: {PreToolUse hook data} => parses successfully', () => {
    const result = HookDataStub();

    expect(result).toStrictEqual({
      hook_event_name: 'PreToolUse',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: process.cwd(),
      tool_name: 'Write',
      tool_input: {
        file_path: '/test/file.ts',
        content: '',
      },
    });
  });

  it('VALID: {custom tool_name} => parses successfully', () => {
    const result = HookDataStub({
      tool_name: 'Edit',
      tool_input: { file_path: '/test/file.ts', old_string: 'old', new_string: 'new' },
    });

    expect(result).toStrictEqual({
      hook_event_name: 'PreToolUse',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: process.cwd(),
      tool_name: 'Edit',
      tool_input: {
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      },
    });
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return hookDataContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
