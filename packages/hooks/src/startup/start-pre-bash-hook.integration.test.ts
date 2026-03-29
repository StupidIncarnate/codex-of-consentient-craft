import { HookDataStub } from '../contracts/hook-data/hook-data.stub';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';

describe('pre-bash-hook', () => {
  const runner = hookRunnerHarness();

  describe('blocked commands', () => {
    it('VALID: {command: "jest"} => returns exit code 2 with redirect message', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'jest' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^.*npm run ward.*$/su),
      });
    });

    it('VALID: {command: "npx jest --verbose"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx jest --verbose' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^.*npm run ward.*$/su),
      });
    });

    it('VALID: {command: "eslint src/"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'eslint src/' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^.*npm run ward.*$/su),
      });
    });

    it('VALID: {command: "npx eslint"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx eslint' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^.*npm run ward.*$/su),
      });
    });

    it('VALID: {command: "tsc --noEmit"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'tsc --noEmit' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^.*npm run ward.*$/su),
      });
    });

    it('VALID: {command: "npx tsc"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx tsc' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^.*npm run ward.*$/su),
      });
    });
  });

  describe('allowed commands', () => {
    it('VALID: {command: "npm test"} => returns exit code 0', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm test' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {command: "npm run lint"} => returns exit code 0', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run lint' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {command: "dungeonmaster-ward"} => returns exit code 0', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'dungeonmaster-ward' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {command: "echo hello"} => returns exit code 0', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'echo hello' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {command: "git status"} => returns exit code 0', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'git status' },
      });

      const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid JSON input} => returns exit code 1', () => {
      const rawResult = runner.runHookRaw({
        hookName: 'start-pre-bash-hook',
        input: 'not json' as never,
      });

      expect({
        status: rawResult.status,
        stdout: rawResult.stdout,
        stderr: rawResult.stderr,
      }).toStrictEqual({
        status: 1,
        stdout: '',
        stderr: expect.stringMatching(/^.*Hook error.*$/su),
      });
    });

    it('ERROR: {empty input} => returns exit code 1', () => {
      const rawResult = runner.runHookRaw({ hookName: 'start-pre-bash-hook', input: '' as never });

      expect({
        status: rawResult.status,
        stdout: rawResult.stdout,
        stderr: rawResult.stderr,
      }).toStrictEqual({
        status: 1,
        stdout: '',
        stderr: expect.stringMatching(/^.*Hook error.*$/su),
      });
    });
  });
});
