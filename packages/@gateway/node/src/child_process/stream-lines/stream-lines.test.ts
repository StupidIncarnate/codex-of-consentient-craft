import { streamLines } from './stream-lines';
import { streamLinesProxy } from './stream-lines.proxy';
import { RunNotFoundError } from '../run-not-found.error';

describe('streamLines()', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = streamLinesProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdoutLines: [] });

      const result = await streamLines({
        command: 'npm',
        args: ['run', 'ward'],
        cwd: '/project',
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null });
    });

    it('VALID: {stdout arrives as multiple lines} => calls onLine per line and accumulates output', async () => {
      const proxy = streamLinesProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdoutLines: ['first', 'second'] });
      const seen: string[] = [];

      const result = await streamLines({
        command: 'npm',
        args: ['run', 'ward'],
        cwd: '/project',
        onLine: (line: string) => {
          seen.push(line);
        },
      });

      expect(seen).toStrictEqual(['first', 'second']);
      expect(result).toStrictEqual({ exitCode: 0, output: 'first\nsecond', signal: null });
    });
  });

  describe('non-zero exit', () => {
    it('INVALID: {command exits with non-zero} => returns that exit code', async () => {
      const proxy = streamLinesProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 1, stdoutLines: ['lint failed'] });

      const result = await streamLines({
        command: 'npm',
        args: ['run', 'lint'],
        cwd: '/project',
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ exitCode: 1, output: 'lint failed', signal: null });
    });
  });

  describe('killed by signal', () => {
    it('ERROR: {child killed by SIGKILL} => reports null exit code alongside the signal', async () => {
      const proxy = streamLinesProxy();
      proxy.setupSignalKill({ command: 'ward', signal: 'SIGKILL' });

      const result = await streamLines({
        command: 'ward',
        args: [],
        cwd: '/project',
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ exitCode: null, output: '', signal: 'SIGKILL' });
    });
  });

  describe('stderr-only output', () => {
    it('VALID: {only stderr prints} => forwards stderr through onLine and folds it into output', async () => {
      const proxy = streamLinesProxy();
      proxy.setupStderrOnly({ command: 'eslint', exitCode: 1, stderrChunks: ['boom'] });
      const seen: string[] = [];

      const result = await streamLines({
        command: 'eslint',
        args: [],
        cwd: '/project',
        onLine: (line: string) => {
          seen.push(line);
        },
      });

      expect(seen).toStrictEqual(['boom']);
      expect(result).toStrictEqual({ exitCode: 1, output: 'boom', signal: null });
    });
  });

  describe('no output at all', () => {
    it('EMPTY: {process prints nothing on either stream} => returns empty output', async () => {
      const proxy = streamLinesProxy();
      proxy.setupSuccess({ command: 'git', exitCode: 0, stdoutLines: [] });

      const result = await streamLines({
        command: 'git',
        args: ['status'],
        cwd: '/project',
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null });
    });
  });

  describe('command not found', () => {
    it('ERROR: {spawn ENOENT} => throws RunNotFoundError naming the command and carrying the code', async () => {
      const proxy = streamLinesProxy();
      proxy.setupError({
        command: 'nonexistent',
        error: Object.assign(new Error('spawn nonexistent ENOENT'), { code: 'ENOENT' }),
      });

      await expect(
        streamLines({
          command: 'nonexistent',
          args: [],
          cwd: '/project',
          onLine: () => undefined,
        }),
      ).rejects.toStrictEqual(
        new RunNotFoundError({
          command: 'nonexistent',
          code: 'ENOENT',
          message: 'spawn nonexistent ENOENT',
        }),
      );
    });
  });

  describe('onLine throws', () => {
    it('ERROR: {onLine callback throws} => logs to stderr and still resolves with full output', async () => {
      const proxy = streamLinesProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdoutLines: ['first'] });

      const result = await streamLines({
        command: 'npm',
        args: ['run', 'ward'],
        cwd: '/project',
        onLine: () => {
          throw new Error('consumer blew up');
        },
      });

      expect(result).toStrictEqual({ exitCode: 0, output: 'first', signal: null });
      expect(
        proxy.captureStderrWrites().some((line) => line.includes('onLine failed for npm stdout')),
      ).toBe(true);
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {command, args, cwd} => passes args through to spawn', async () => {
      const proxy = streamLinesProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdoutLines: [] });

      await streamLines({
        command: 'npm',
        args: ['run', 'ward:all'],
        cwd: '/home/user/project',
        onLine: () => undefined,
      });

      expect(proxy.getSpawnedArgs({ command: 'npm' })).toStrictEqual(['run', 'ward:all']);
    });
  });
});
