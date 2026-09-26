import { run } from './run';
import { runProxy } from './run.proxy';

describe('run()', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '' });

      const result = await run({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
    });

    it('VALID: {command exits with 0 and stdout} => returns stdout content', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: 'All tests passed', stderr: '' });

      const result = await run({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'All tests passed',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('non-zero exit', () => {
    it('INVALID: {command exits with non-zero} => returns that exit code and stderr content', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'npm',
        exitCode: 1,
        stdout: '',
        stderr: 'Error in /src/file.ts',
      });

      const result = await run({ command: 'npm', args: ['run', 'lint'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'Error in /src/file.ts',
        signal: null,
        timedOut: false,
      });
    });

    it('INVALID: {stdout and stderr both present} => folds both into one combined output', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'npm',
        exitCode: 1,
        stdout: 'stdout content',
        stderr: 'stderr content',
      });

      const result = await run({ command: 'npm', args: ['run', 'ward'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'stdout contentstderr content',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('killed by signal', () => {
    it('ERROR: {child killed by SIGTERM} => reports exit code 1 with the killing signal', async () => {
      const proxy = runProxy();
      proxy.setupSignalKill({
        command: 'playwright',
        signal: 'SIGTERM',
        stdout: 'partial run output',
        stderr: '',
      });

      const result = await run({ command: 'playwright', args: ['test'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'partial run output',
        signal: 'SIGTERM',
        timedOut: false,
      });
    });

    it('ERROR: {child killed by SIGKILL with no output} => reports the signal, not just an exit code that hides it', async () => {
      const proxy = runProxy();
      proxy.setupSignalKill({ command: 'eslint', signal: 'SIGKILL', stdout: '', stderr: '' });

      const result = await run({ command: 'eslint', args: ['.'], cwd: '/project' });

      // The exit code alone cannot say this: a child killed from outside has none of its own, so
      // it reads as 1 — identical to a command choosing to fail. `signal` is the only field that
      // separates the two, and SIGKILL with no output is what an out-of-memory reaper leaves
      // behind.
      expect(result).toStrictEqual({
        exitCode: 1,
        output: '',
        signal: 'SIGKILL',
        timedOut: false,
      });
    });
  });

  describe('timeout', () => {
    it('ERROR: {process runs past the timeout} => kills the child and reports timedOut true', async () => {
      const proxy = runProxy();
      proxy.setupHangsUntilKilled({ command: 'sleep', signalOnKill: 'SIGTERM' });

      const result = await run({
        command: 'sleep',
        args: ['9999'],
        cwd: '/project',
        timeout: 5,
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: '',
        signal: 'SIGTERM',
        timedOut: true,
      });
      expect(proxy.getKillCallCount({ command: 'sleep' })).toBe(1);
    });

    it('VALID: {process finishes before the timeout} => reports timedOut false and never kills', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: 'done', stderr: '' });

      const result = await run({
        command: 'npm',
        args: ['run', 'test'],
        cwd: '/project',
        timeout: 60_000,
      });

      expect(result).toStrictEqual({ exitCode: 0, output: 'done', signal: null, timedOut: false });
      expect(proxy.getKillCallCount({ command: 'npm' })).toBe(0);
    });
  });

  describe('command not found', () => {
    it('ERROR: {spawn ENOENT} => returns exit code 1 and empty output, never throws', async () => {
      const proxy = runProxy();
      proxy.setupError({
        command: 'nonexistent',
        error: Object.assign(new Error('spawn nonexistent ENOENT'), { code: 'ENOENT' }),
      });

      const result = await run({ command: 'nonexistent', args: [], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 1, output: '', signal: null, timedOut: false });
    });
  });

  describe('no output at all', () => {
    it('EMPTY: {command prints nothing on either stream} => returns empty output', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'git', exitCode: 0, stdout: '', stderr: '' });

      const result = await run({ command: 'git', args: ['status'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
    });
  });

  describe('stdio drains after exit fires', () => {
    it('EDGE: {child exits but neither stdio stream ever emits end/close} => promise stays unsettled', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'npm',
        exitCode: 0,
        stdout: '',
        stderr: '',
        neverDrain: true,
      });

      const boundedWait = new Promise((resolve) => {
        setTimeout(() => {
          resolve('bounded-wait-won');
        }, 50);
      });

      const result = await Promise.race([
        run({ command: 'npm', args: ['run', 'test'], cwd: '/project' }),
        boundedWait,
      ]);

      expect(result).toBe('bounded-wait-won');
    });
  });
});
