import { runSync } from './run-sync';
import { runSyncProxy } from './run-sync.proxy';
import { RunNotFoundError } from './run-not-found-error';

describe('runSync()', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and stdout', () => {
      const proxy = runSyncProxy();
      proxy.setupSuccess({ command: 'npm', stdout: 'added 1 package' });

      const result = runSync({ command: 'npm', args: ['install'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'added 1 package',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('non-zero exit', () => {
    it('INVALID: {command exits with non-zero} => returns that exit code and combined output', () => {
      const proxy = runSyncProxy();
      proxy.setupNonZeroExit({
        command: 'npm',
        status: 1,
        stdout: '',
        stderr: 'npm ERR! missing script',
      });

      const result = runSync({ command: 'npm', args: ['run', 'nope'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'npm ERR! missing script',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('killed by signal', () => {
    it('ERROR: {child killed by SIGTERM, no timeout requested} => reports the signal, timedOut false', () => {
      const proxy = runSyncProxy();
      proxy.setupSignalKill({ command: 'sleep', signal: 'SIGTERM', stdout: 'partial' });

      const result = runSync({ command: 'sleep', args: ['9999'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'partial',
        signal: 'SIGTERM',
        timedOut: false,
      });
    });
  });

  describe('timeout', () => {
    it('ERROR: {signal kill with a timeout requested} => reports timedOut true', () => {
      const proxy = runSyncProxy();
      proxy.setupSignalKill({ command: 'sleep', signal: 'SIGTERM' });

      const result = runSync({ command: 'sleep', args: ['9999'], cwd: '/project', timeout: 5 });

      expect(result).toStrictEqual({ exitCode: 1, output: '', signal: 'SIGTERM', timedOut: true });
    });
  });

  describe('command not found', () => {
    it('ERROR: {execFileSync ENOENT} => throws RunNotFoundError naming the command and carrying the code', () => {
      const proxy = runSyncProxy();
      proxy.setupNotFound({
        command: 'nonexistent',
        code: 'ENOENT',
        message: 'spawnSync nonexistent ENOENT',
      });

      expect(() => runSync({ command: 'nonexistent', args: [], cwd: '/project' })).toThrow(
        new RunNotFoundError({
          command: 'nonexistent',
          code: 'ENOENT',
          message: 'spawnSync nonexistent ENOENT',
        }),
      );
    });
  });

  describe('no output at all', () => {
    it('EMPTY: {command prints nothing on either stream} => returns empty output', () => {
      const proxy = runSyncProxy();
      proxy.setupSuccess({ command: 'git', stdout: '' });

      const result = runSync({ command: 'git', args: ['status'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
    });
  });
});
