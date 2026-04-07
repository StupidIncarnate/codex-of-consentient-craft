import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';

describe('start-worktree-create-hook', () => {
  const runner = hookRunnerHarness();

  describe('StartWorktreeCreateHook', () => {
    it('ERROR: {invalid JSON input} => returns exit code 1 with error message', () => {
      const rawResult = runner.runHookRaw({
        hookName: 'start-worktree-create-hook',
        input: 'not json' as never,
      });

      expect({
        status: rawResult.status,
        stdout: rawResult.stdout,
        stderr: rawResult.stderr,
      }).toStrictEqual({
        status: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n(?:.+\n)*$/su),
      });
    });

    it('ERROR: {empty input} => returns exit code 1 with error message', () => {
      const rawResult = runner.runHookRaw({
        hookName: 'start-worktree-create-hook',
        input: '' as never,
      });

      expect({
        status: rawResult.status,
        stdout: rawResult.stdout,
        stderr: rawResult.stderr,
      }).toStrictEqual({
        status: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n(?:.+\n)*$/su),
      });
    });
  });
});
