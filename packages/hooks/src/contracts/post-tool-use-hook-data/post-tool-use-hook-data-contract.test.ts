import { postToolUseHookDataContract } from './post-tool-use-hook-data-contract';
import { PostToolUseHookStub } from './post-tool-use-hook-data.stub';

describe('postToolUseHookDataContract', () => {
  describe('valid input', () => {
    it('VALID: {default values} => parses successfully', () => {
      const data = PostToolUseHookStub();
      const result = postToolUseHookDataContract.parse(data);

      expect(result).toStrictEqual({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        tool_input: {
          file_path: '/test/file.ts',
          content: '',
        },
      });
    });

    it('VALID: {with tool response} => parses successfully', () => {
      const data = PostToolUseHookStub({
        tool_response: { success: true, filePath: '/test/output.ts' },
      });
      const result = postToolUseHookDataContract.parse(data);

      expect(result).toStrictEqual({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        tool_input: {
          file_path: '/test/file.ts',
          content: '',
        },
        tool_response: { success: true, filePath: '/test/output.ts' },
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID_HOOK_EVENT_NAME: {hook_event_name: not PostToolUse} => throws validation error', () => {
      expect(() => {
        return postToolUseHookDataContract.parse({
          session_id: 'test',
          transcript_path: '/test',
          cwd: '/cwd',
          hook_event_name: 'PreToolUse' as never,
          tool_name: 'Write',
          tool_input: { file_path: '/test.ts', content: '' },
        });
      }).toThrow(/PostToolUse/u);
    });

    it('INVALID_MISSING_TOOL_NAME: {missing tool_name} => throws validation error', () => {
      expect(() => {
        return postToolUseHookDataContract.parse({
          session_id: 'test',
          transcript_path: '/test',
          cwd: '/cwd',
          hook_event_name: 'PostToolUse',
        } as never);
      }).toThrow(/Required/u);
    });
  });
});
