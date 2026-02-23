import * as path from 'path';
import { spawnSync } from 'child_process';
import { HookDataStub } from '../contracts/hook-data/hook-data.stub';
import { ExecResultStub } from '../contracts/exec-result/exec-result.stub';

const hookPath = path.join(process.cwd(), 'src', 'startup', 'start-pre-bash-hook.ts');

const runHook = ({ hookData }: { hookData: unknown }): ReturnType<typeof ExecResultStub> => {
  const input = JSON.stringify(hookData);

  const result = spawnSync('npx', ['tsx', hookPath], {
    input,
    encoding: 'utf8',
    cwd: process.cwd(),
  });

  return ExecResultStub({
    exitCode: result.status === null ? 1 : result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  });
};

describe('pre-bash-hook', () => {
  describe('blocked commands', () => {
    it('VALID: {command: "jest"} => returns exit code 2 with redirect message', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'jest' },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/npm run ward/u);
    });

    it('VALID: {command: "npx jest --verbose"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx jest --verbose' },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/npm run ward/u);
    });

    it('VALID: {command: "eslint src/"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'eslint src/' },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/npm run ward/u);
    });

    it('VALID: {command: "npx eslint"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx eslint' },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/npm run ward/u);
    });

    it('VALID: {command: "tsc --noEmit"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'tsc --noEmit' },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/npm run ward/u);
    });

    it('VALID: {command: "npx tsc"} => returns exit code 2', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx tsc' },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/npm run ward/u);
    });
  });

  describe('allowed commands', () => {
    it('VALID: {command: "npm test"} => returns exit code 0', () => {
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm test' },
      });

      const result = runHook({ hookData });

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

      const result = runHook({ hookData });

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

      const result = runHook({ hookData });

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

      const result = runHook({ hookData });

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

      const result = runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid JSON input} => returns exit code 1', () => {
      const result = spawnSync('npx', ['tsx', hookPath], {
        input: 'not json',
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/Hook error/u);
    });

    it('ERROR: {empty input} => returns exit code 1', () => {
      const result = spawnSync('npx', ['tsx', hookPath], {
        input: '',
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/Hook error/u);
    });
  });
});
