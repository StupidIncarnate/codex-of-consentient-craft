import { HookPostEditResponder } from './hook-post-edit-responder';
import { HookPostEditResponderProxy } from './hook-post-edit-responder.proxy';
import { PostToolUseHookStub } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { EditToolInputStub } from '../../../contracts/edit-tool-input/edit-tool-input.stub';
import { HookDataStub } from '../../../contracts/hook-data/hook-data.stub';

describe('HookPostEditResponder', () => {
  describe('with valid PostToolUse hook data', () => {
    it('VALID: {PostToolUse with no violations} => returns success result', async () => {
      const proxy = HookPostEditResponderProxy();
      proxy.setupPostEdit({ hasViolations: false });

      const hookData = PostToolUseHookStub({
        tool_input: EditToolInputStub({
          file_path: '/test/file.ts',
          old_string: 'old',
          new_string: 'new',
        }),
        cwd: '/test',
      });

      const result = await HookPostEditResponder({ input: hookData });

      expect(result.violations).toStrictEqual([
        {
          filePath: '/test/file.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
      expect(result.message).toBe('All violations auto-fixed successfully');
    });

    it('VALID: {PostToolUse with violations} => returns violations result', async () => {
      const proxy = HookPostEditResponderProxy();
      proxy.setupPostEdit({ hasViolations: true });

      const hookData = PostToolUseHookStub({
        tool_input: EditToolInputStub({
          file_path: '/test/file.ts',
          old_string: 'old',
          new_string: 'new',
        }),
        cwd: '/test',
      });

      const result = await HookPostEditResponder({ input: hookData });

      expect(result.violations).toStrictEqual([
        {
          filePath: '/test/file.ts',
          messages: [
            {
              ruleId: 'no-console',
              severity: 2,
              message: 'Unexpected console statement',
              line: 1,
              column: 1,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);
      expect(result.message).toMatch(/Unexpected console statement/iu);
    });
  });

  describe('with invalid hook data', () => {
    it('ERROR: {non-PostToolUse hook event} => throws unsupported event error', async () => {
      const proxy = HookPostEditResponderProxy();
      proxy.setupPostEdit();

      const hookData = HookDataStub({
        hook_event_name: 'PreToolUse',
      });

      await expect(HookPostEditResponder({ input: hookData })).rejects.toThrow(
        /Unsupported hook event: PreToolUse/u,
      );
    });

    it('ERROR: {SessionStart hook event} => throws unsupported event error', async () => {
      const proxy = HookPostEditResponderProxy();
      proxy.setupPostEdit();

      const hookData = HookDataStub({
        hook_event_name: 'SessionStart',
      });

      await expect(HookPostEditResponder({ input: hookData })).rejects.toThrow(
        /Unsupported hook event: SessionStart/u,
      );
    });
  });
});
