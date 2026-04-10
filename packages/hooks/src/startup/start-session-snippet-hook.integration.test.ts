import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { SessionStartHookStub } from '../contracts/session-start-hook-data/session-start-hook-data.stub';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';

describe('start-session-snippet-hook', () => {
  const runner = hookRunnerHarness();

  describe('StartSessionSnippetHook', () => {
    it('VALID: {args: ["discover"]} => exits with code 0 and discover snippet in stdout', () => {
      const hookData = SessionStartHookStub();

      const result = runner.runHook({
        hookName: 'start-session-snippet-hook',
        hookData,
        args: ['discover'],
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-discover>\n${sessionSnippetStatics.discover}\n</dungeonmaster-discover>\n`,
        stderr: '',
      });
    });

    it('VALID: {args: ["ward"]} => exits with code 0 and ward snippet in stdout', () => {
      const hookData = SessionStartHookStub();

      const result = runner.runHook({
        hookName: 'start-session-snippet-hook',
        hookData,
        args: ['ward'],
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-ward>\n${sessionSnippetStatics.ward}\n</dungeonmaster-ward>\n`,
        stderr: '',
      });
    });

    it('ERROR: {args: ["nonexistent"]} => exits with code 1 and error in stderr', () => {
      const hookData = SessionStartHookStub();

      const result = runner.runHook({
        hookName: 'start-session-snippet-hook',
        hookData,
        args: ['nonexistent'],
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: nonexistent\n',
      });
    });

    it('ERROR: {no args} => exits with code 1 and error in stderr', () => {
      const hookData = SessionStartHookStub();

      const result = runner.runHook({
        hookName: 'start-session-snippet-hook',
        hookData,
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: (none)\n',
      });
    });
  });
});
