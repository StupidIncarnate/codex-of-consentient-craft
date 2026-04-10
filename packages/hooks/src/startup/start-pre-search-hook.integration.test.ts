import { PreSearchHookDataStub } from '../contracts/pre-search-hook-data/pre-search-hook-data.stub';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';

describe('pre-search-hook', () => {
  const runner = hookRunnerHarness();

  describe('blocked: all grep and glob calls', () => {
    it('VALID: {Grep, pattern: "permission"} => returns exit code 2 with discover guide', () => {
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

    it('VALID: {Glob, pattern: "**/*.ts"} => returns exit code 2', () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Glob',
        tool_input: { pattern: '**/*.ts' },
      });

      const result = runner.runHook({ hookName: 'start-pre-search-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });

    it('VALID: {Grep, output_mode: "content"} => returns exit code 2 (previously allowed, now blocked)', () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Grep',
        tool_input: { pattern: 'import', output_mode: 'content' },
      });

      const result = runner.runHook({ hookName: 'start-pre-search-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });

    it('VALID: {Glob, pattern: "**/*.json"} => returns exit code 2 (previously allowed, now blocked)', () => {
      const hookData = PreSearchHookDataStub({
        tool_name: 'Glob',
        tool_input: { pattern: '**/*.json' },
      });

      const result = runner.runHook({ hookName: 'start-pre-search-hook', hookData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Native search tools are disabled\..*\n$/su),
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid JSON input} => returns exit code 1', () => {
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

    it('ERROR: {empty input} => returns exit code 1', () => {
      const rawResult = runner.runHookRaw({
        hookName: 'start-pre-search-hook',
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
