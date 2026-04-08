import { SessionStartHookStub } from '../contracts/session-start-hook-data/session-start-hook-data.stub';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';

describe('start-session-start-hook', () => {
  const runner = hookRunnerHarness();

  describe('StartSessionStartHook', () => {
    it('VALID: {inputData: valid session start hook data} => exits with code 0 and architecture content in stdout', () => {
      const hookData = SessionStartHookStub();

      const result = runner.runHook({ hookName: 'start-session-start-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+<\/dungeonmaster-architecture>\n\n<dungeonmaster-project-map>\n.+<\/dungeonmaster-project-map>\n$/su,
        ),
        stderr: '',
      });
    });

    it('ERROR: {invalid JSON input} => returns exit code 1 with error message', () => {
      const rawResult = runner.runHookRaw({
        hookName: 'start-session-start-hook',
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
        hookName: 'start-session-start-hook',
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
