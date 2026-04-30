import { HookDataStub } from '../contracts/hook-data/hook-data.stub';

import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

describe('pre-bash-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-pre-bash-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  describe('blocked commands', () => {
    it('VALID: {command: "jest"} => returns exit code 2 with redirect message', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'jest' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: 'Blocked: direct jest invocation. Use instead: `npm run ward -- --only test`\n',
      });
    });

    it('VALID: {command: "npx jest --verbose"} => returns exit code 2', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx jest --verbose' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr:
          'Blocked: direct jest invocation. Use instead: `npm run ward -- --only test -- --verbose`\n',
      });
    });

    it('VALID: {command: "eslint src/"} => returns exit code 2', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'eslint src/' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: 'Blocked: direct eslint invocation. Use instead: `npm run ward -- --only lint`\n',
      });
    });

    it('VALID: {command: "npx eslint"} => returns exit code 2', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx eslint' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: 'Blocked: direct eslint invocation. Use instead: `npm run ward -- --only lint`\n',
      });
    });

    it('VALID: {command: "tsc --noEmit"} => returns exit code 2', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'tsc --noEmit' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: 'Blocked: direct tsc invocation. Use instead: `npm run ward -- --only typecheck`\n',
      });
    });

    it('VALID: {command: "npx tsc"} => returns exit code 2', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx tsc' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: 'Blocked: direct tsc invocation. Use instead: `npm run ward -- --only typecheck`\n',
      });
    });
  });

  describe('allowed commands', () => {
    it('VALID: {command: "npm test"} => returns exit code 0', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm test' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {command: "npm run lint"} => returns exit code 0', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run lint' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {command: "dungeonmaster-ward", no timeout} => returns exit code 0 with updatedInput timeout', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'dungeonmaster-ward' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            updatedInput: { timeout: 600_000 },
          },
        }),
        stderr: '',
      });
    });

    it('VALID: {command: "echo hello"} => returns exit code 0', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'echo hello' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {command: "git status"} => returns exit code 0', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'git status' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('ward timeout enforcement', () => {
    it('VALID: {command: "npm run ward", timeout: 120000} => returns updatedInput with timeout 600000', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward', timeout: 120_000 },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            updatedInput: { timeout: 600_000 },
          },
        }),
        stderr: '',
      });
    });

    it('VALID: {command: "npm run ward", timeout: 600000} => no override needed', async () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward', timeout: 600_000 },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid JSON input} => returns exit code 1', async () => {
      const result = await persistentRunner.runHookRaw({ rawInput: 'not json' });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      }).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n(?:.+\n)*$/su),
      });
    });

    it('ERROR: {empty input} => returns exit code 1', async () => {
      const result = await persistentRunner.runHookRaw({ rawInput: '' });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      }).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n(?:.+\n)*$/su),
      });
    });
  });
});
