import { postToolUseHookDataContract } from './post-tool-use-hook-data-contract';
import { PostToolUseHookStub } from './post-tool-use-hook-data.stub';

describe('postToolUseHookDataContract', () => {
  describe('valid input', () => {
    it('VALID: {default values} => parses successfully', () => {
      const data = PostToolUseHookStub();
      const result = postToolUseHookDataContract.parse(data);

      expect(result.hook_event_name).toBe('PostToolUse');
      expect(result.tool_name).toBe('Write');
      expect(result.tool_input.file_path).toBe('/test/file.ts');
    });

    it('VALID: {with tool response} => parses successfully', () => {
      const data = PostToolUseHookStub({
        tool_response: { success: true, filePath: '/test/output.ts' },
      });
      const result = postToolUseHookDataContract.parse(data);

      expect(result.tool_response).toBeDefined();
      expect(result.tool_response?.success).toBe(true);
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
