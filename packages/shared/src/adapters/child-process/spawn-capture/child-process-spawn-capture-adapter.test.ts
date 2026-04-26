import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  ExitCodeStub,
} from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapter } from './child-process-spawn-capture-adapter';
import { childProcessSpawnCaptureAdapterProxy } from './child-process-spawn-capture-adapter.proxy';

describe('childProcessSpawnCaptureAdapter', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        exitCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 0 }),
        output: ErrorMessageStub({ value: '' }),
      });
    });

    it('VALID: {command exits with 0 and stdout} => returns exit code 0 and stdout content', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        exitCode,
        stdout: ErrorMessageStub({ value: 'All tests passed' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 0 }),
        output: ErrorMessageStub({ value: 'All tests passed' }),
      });
    });
  });

  describe('failure execution', () => {
    it('VALID: {command exits with non-zero} => returns exit code and stderr content', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({
        exitCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: 'Error in /src/file.ts' }),
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'lint'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: 'Error in /src/file.ts' }),
      });
    });

    it('VALID: {command exits with non-zero and both stdout+stderr} => returns combined output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({
        exitCode,
        stdout: ErrorMessageStub({ value: 'stdout content' }),
        stderr: ErrorMessageStub({ value: 'stderr content' }),
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'ward:all'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: 'stdout contentstderr content' }),
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {spawn error} => returns exit code 1 and empty output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      proxy.setupError({ error: new Error('ENOENT: command not found') });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'nonexistent',
        args: [],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: '' }),
      });
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {command, args, cwd} => passes correct arguments to spawn', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        exitCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'ward:all'],
        cwd: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCommand()).toBe('npm');
      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', 'ward:all']);
      expect(proxy.getSpawnedCwd()).toBe('/home/user/project');
    });

    it('VALID: {any command} => spawns with inherited stdin and piped stdout/stderr', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        exitCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      const options = proxy.getSpawnedOptions();

      const { stdio } = options as { stdio?: unknown };

      expect(stdio).toStrictEqual(['inherit', 'pipe', 'pipe']);
    });
  });
});
