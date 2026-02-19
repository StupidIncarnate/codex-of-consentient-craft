import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapter } from './child-process-spawn-capture-adapter';
import { childProcessSpawnCaptureAdapterProxy } from './child-process-spawn-capture-adapter.proxy';

describe('childProcessSpawnCaptureAdapter', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: '', stderr: '' });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: '',
      });
    });

    it('VALID: {command exits with 0 and stdout} => returns exit code 0 and stdout content', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: 'All tests passed', stderr: '' });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'All tests passed',
      });
    });
  });

  describe('failure execution', () => {
    it('VALID: {command exits with non-zero} => returns exit code and stderr content', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({ exitCode, stdout: '', stderr: 'Error in /src/file.ts' });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'lint'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'Error in /src/file.ts',
      });
    });

    it('VALID: {command exits with non-zero and both stdout+stderr} => returns combined output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({
        exitCode,
        stdout: 'stdout content',
        stderr: 'stderr content',
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'ward:all'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'stdout contentstderr content',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {execFile error without code} => returns exit code 1 and empty output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      proxy.setupError({ error: new Error('ENOENT: command not found') });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'nonexistent',
        args: [],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: '',
      });
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {command, args, cwd} => passes correct arguments to spawn', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: '', stderr: '' });

      await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'ward:all'],
        cwd: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCommand()).toBe('npm');
      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', 'ward:all']);
    });

    it('VALID: {any command} => passes maxBuffer option to execFile', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: '', stderr: '' });

      await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      const options: unknown = proxy.getSpawnedOptions();
      const FIFTY_MB = 52_428_800;

      expect(Reflect.get(options as object, 'maxBuffer')).toBe(FIFTY_MB);
    });
  });
});
