import { BashToolInputStub } from '../../../contracts/bash-tool-input/bash-tool-input.stub';
import { PostToolUseHookStub } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { HookPostBashResponder } from './hook-post-bash-responder';
import { HookPostBashResponderProxy } from './hook-post-bash-responder.proxy';

describe('HookPostBashResponder', () => {
  describe('npm install naming a package', () => {
    it('VALID: {npm install left-pad, sync exits 0} => runs gateway-sync in the hook cwd and returns its output as PostToolUse context', async () => {
      const proxy = HookPostBashResponderProxy();
      proxy.setupSyncSucceeds({ cwd: '/repo/consumer', output: 'generated: left-pad\n' });
      const hookData = PostToolUseHookStub({
        tool_name: 'Bash',
        cwd: '/repo/consumer',
        tool_input: BashToolInputStub({ command: 'npm install left-pad' }),
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext:
              'dungeonmaster gateway-sync ran after this npm install:\ngenerated: left-pad',
          },
        }),
        stderr: '',
        exitCode: 0,
      });
      expect(proxy.getSyncSpawns()).toStrictEqual([
        { args: ['gateway-sync'], cwd: '/repo/consumer' },
      ]);
    });

    it('VALID: {cd packages/web && npm i -D left-pad -w packages/web} => runs gateway-sync in the hook cwd', async () => {
      const proxy = HookPostBashResponderProxy();
      proxy.setupSyncSucceeds({ cwd: '/repo/consumer', output: '' });
      const hookData = PostToolUseHookStub({
        tool_name: 'Bash',
        cwd: '/repo/consumer',
        tool_input: BashToolInputStub({
          command: 'cd packages/web && npm i -D left-pad -w packages/web',
        }),
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext:
              'dungeonmaster gateway-sync ran after this npm install:\n(no output)',
          },
        }),
        stderr: '',
        exitCode: 0,
      });
      expect(proxy.getSyncSpawns()).toStrictEqual([
        { args: ['gateway-sync'], cwd: '/repo/consumer' },
      ]);
    });

    it('ERROR: {sync exits 1} => exits 0 and reports the failure as context', async () => {
      const proxy = HookPostBashResponderProxy();
      proxy.setupSyncFails({ cwd: '/repo/consumer', exitCode: 1, output: 'write failed\n' });
      const hookData = PostToolUseHookStub({
        tool_name: 'Bash',
        cwd: '/repo/consumer',
        tool_input: BashToolInputStub({ command: 'npm install left-pad' }),
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext:
              'dungeonmaster gateway-sync exited 1 after this npm install, so packages/@gateway/npm/src may lack a folder for the new package. Fix the cause and run `dungeonmaster gateway-sync` again. Output:\nwrite failed',
          },
        }),
        stderr: '',
        exitCode: 0,
      });
    });

    it('ERROR: {dungeonmaster binary missing} => exits 0 and reports that the sync never ran', async () => {
      const proxy = HookPostBashResponderProxy();
      proxy.setupSyncMissing({ cwd: '/repo/consumer' });
      const hookData = PostToolUseHookStub({
        tool_name: 'Bash',
        cwd: '/repo/consumer',
        tool_input: BashToolInputStub({ command: 'npm install left-pad' }),
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext:
              'dungeonmaster gateway-sync did not run after this npm install: "dungeonmaster" never started: ENOENT: open \'dungeonmaster\'. Run `dungeonmaster gateway-sync` yourself so packages/@gateway/npm/src gets a folder for the new package.',
          },
        }),
        stderr: '',
        exitCode: 0,
      });
    });
  });

  describe('commands that add no package', () => {
    it('EMPTY: {npm install} => returns silent result and spawns nothing', async () => {
      const proxy = HookPostBashResponderProxy();
      const hookData = PostToolUseHookStub({
        tool_name: 'Bash',
        tool_input: BashToolInputStub({ command: 'npm install' }),
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getSyncSpawns()).toStrictEqual([]);
    });

    it('INVALID: {ls -la} => returns silent result and spawns nothing', async () => {
      const proxy = HookPostBashResponderProxy();
      const hookData = PostToolUseHookStub({
        tool_name: 'Bash',
        tool_input: BashToolInputStub({ command: 'ls -la' }),
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getSyncSpawns()).toStrictEqual([]);
    });
  });

  describe('payloads the hook does not handle', () => {
    it('INVALID: {tool_name: Write} => returns silent result and spawns nothing', async () => {
      const proxy = HookPostBashResponderProxy();
      const hookData = PostToolUseHookStub({
        tool_name: 'Write',
        tool_input: { command: 'npm install left-pad' },
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getSyncSpawns()).toStrictEqual([]);
    });

    it('INVALID: {Bash tool_input without command} => returns silent result and spawns nothing', async () => {
      const proxy = HookPostBashResponderProxy();
      const hookData = PostToolUseHookStub({
        tool_name: 'Bash',
        tool_input: { description: 'no command here' },
      });

      const result = await HookPostBashResponder({ inputData: JSON.stringify(hookData) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getSyncSpawns()).toStrictEqual([]);
    });

    it('INVALID: {PreToolUse payload} => returns silent result and spawns nothing', async () => {
      const proxy = HookPostBashResponderProxy();

      const result = await HookPostBashResponder({
        inputData: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Bash',
          tool_input: { command: 'npm install left-pad' },
        }),
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getSyncSpawns()).toStrictEqual([]);
    });

    it('ERROR: {inputData: not JSON} => throws the parse error for the flow to report', async () => {
      HookPostBashResponderProxy();

      await expect(HookPostBashResponder({ inputData: 'not json' })).rejects.toThrow(
        /^Unexpected token 'o', "not json" is not valid JSON$/u,
      );
    });
  });
});
