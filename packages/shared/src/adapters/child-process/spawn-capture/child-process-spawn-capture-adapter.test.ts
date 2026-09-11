import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  ExitCodeStub,
  ProcessSignalStub,
} from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapter } from './child-process-spawn-capture-adapter';
import { childProcessSpawnCaptureAdapterProxy } from './child-process-spawn-capture-adapter.proxy';

describe('childProcessSpawnCaptureAdapter', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        command: 'npm',
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
        signal: null,
      });
    });

    it('VALID: {command exits with 0 and stdout} => returns exit code 0 and stdout content', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        command: 'npm',
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
        signal: null,
      });
    });

    it('VALID: {stdio drains AFTER the exit event fires} => still returns full stdout content', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        command: 'npm',
        exitCode,
        stdout: ErrorMessageStub({ value: 'All tests passed' }),
        stderr: ErrorMessageStub({ value: '' }),
        raceExitBeforeDrain: true,
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 0 }),
        output: ErrorMessageStub({ value: 'All tests passed' }),
        signal: null,
      });
    });
  });

  describe('failure execution', () => {
    it('VALID: {command exits with non-zero} => returns exit code and stderr content', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({
        command: 'npm',
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
        signal: null,
      });
    });

    it('VALID: {command exits with non-zero and both stdout+stderr} => returns combined output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({
        command: 'npm',
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
        signal: null,
      });
    });
  });

  describe('signal kill', () => {
    it('VALID: {child killed by SIGTERM} => returns exit code 1 with captured output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      proxy.setupSignalKill({
        command: 'playwright',
        signal: 'SIGTERM',
        stdout: ErrorMessageStub({ value: 'partial run output' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'playwright',
        args: ['test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: 'partial run output' }),
        signal: ProcessSignalStub({ value: 'SIGTERM' }),
      });
    });

    it('VALID: {child killed by SIGKILL} => reports the signal, not just the exit code that hides it', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      proxy.setupSignalKill({
        command: 'eslint',
        signal: 'SIGKILL',
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'eslint',
        args: ['.'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      // The exit code alone cannot say this: a child killed from outside has none of its own, so it
      // reads as 1 — identical to eslint choosing to fail over lint errors. `signal` is the only
      // field that separates the two, and SIGKILL with no output is what the kernel's
      // out-of-memory reaper leaves behind.
      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: '' }),
        signal: ProcessSignalStub({ value: 'SIGKILL' }),
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {spawn error} => returns exit code 1 and empty output', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      proxy.setupError({
        command: 'nonexistent',
        error: new Error('ENOENT: command not found'),
      });

      const result = await childProcessSpawnCaptureAdapter({
        command: 'nonexistent',
        args: [],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: '' }),
        signal: null,
      });
    });
  });

  describe('stdio pipe never drains', () => {
    it('EDGE: {child exits but neither stdio stream ever emits end/close} => promise stays unsettled', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        command: 'npm',
        exitCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
        neverDrain: true,
      });

      const boundedWait = new Promise((resolve) => {
        setTimeout(() => {
          resolve(undefined);
        }, 50);
      });

      const result = await Promise.race([
        childProcessSpawnCaptureAdapter({
          command: 'npm',
          args: ['run', 'test'],
          cwd: AbsoluteFilePathStub({ value: '/project' }),
        }),
        boundedWait,
      ]);

      expect(result).toBe(undefined);
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {command, args, cwd} => passes correct arguments to spawn', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        command: 'npm',
        exitCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'ward:all'],
        cwd: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCommand({ command: 'npm' })).toBe('npm');
      expect(proxy.getSpawnedArgs({ command: 'npm' })).toStrictEqual(['run', 'ward:all']);
      expect(proxy.getSpawnedCwd({ command: 'npm' })).toBe('/home/user/project');
    });

    it('VALID: {any command} => spawns with inherited stdin and piped stdout/stderr', async () => {
      const proxy = childProcessSpawnCaptureAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({
        command: 'npm',
        exitCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });

      await childProcessSpawnCaptureAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      const options = proxy.getSpawnedOptions({ command: 'npm' });

      const { stdio } = options as { stdio?: unknown };

      expect(stdio).toStrictEqual(['inherit', 'pipe', 'pipe']);
    });
  });
});
