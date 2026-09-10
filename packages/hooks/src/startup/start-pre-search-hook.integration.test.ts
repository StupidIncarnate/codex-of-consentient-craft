import { PreSearchHookDataStub } from '../contracts/pre-search-hook-data/pre-search-hook-data.stub';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';
import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

describe('pre-search-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-pre-search-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  // Real spawnSync of the actual start-pre-search-hook.ts binary. Everything below this block
  // runs through the shared persistent worker instead (one child process for the whole file),
  // which exercises the same flow but not the startup file's own stdin-buffering and process.exit()
  // wiring — these two calls are what still prove that wiring works end to end.
  describe('process smoke tests', () => {
    const runner = hookRunnerHarness();

    it('VALID: real process, {Grep, pattern: "permission"} => returns exit code 2 with discover guide', () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Grep',
        tool_input: { pattern: 'permission' },
      });

      const result = runner.runHook({ hookName: 'start-pre-search-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });

    it('ERROR: real process, {invalid JSON input} => returns exit code 1', () => {
      const rawResult = runner.runHookRaw({
        hookName: 'start-pre-search-hook',
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
  });

  describe('blocked: all grep and glob calls', () => {
    it('VALID: {Grep, pattern: "permission"} => returns exit code 2 with discover guide', async () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Grep',
        tool_input: { pattern: 'permission' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });

    it('VALID: {Glob, pattern: "**/*.ts"} => returns exit code 2', async () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Glob',
        tool_input: { pattern: '**/*.ts' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });

    it('VALID: {Grep, output_mode: "content"} => returns exit code 2 (previously allowed, now blocked)', async () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Grep',
        tool_input: { pattern: 'import', output_mode: 'content' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });

    it('VALID: {Glob, pattern: "**/*.json"} => returns exit code 2 (previously allowed, now blocked)', async () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Glob',
        tool_input: { pattern: '**/*.json' },
      });

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid JSON input} => returns exit code 1', async () => {
      const result = await persistentRunner.runHookRaw({ rawInput: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n(?:.+\n)*$/su),
      });
    });

    it('ERROR: {empty input} => returns exit code 1', async () => {
      const result = await persistentRunner.runHookRaw({ rawInput: '' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n(?:.+\n)*$/su),
      });
    });
  });
});
