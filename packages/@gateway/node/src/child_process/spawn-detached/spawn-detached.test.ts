import { spawnDetached } from './spawn-detached';
import { spawnDetachedProxy } from './spawn-detached.proxy';

describe('spawnDetached()', () => {
  describe('successful spawn', () => {
    it('VALID: {spawn produces a pid} => returns pid and pgid equal to it, its own group leader', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupSuccess({
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        cwd: '/repo',
        pid: 4821,
      });

      const result = spawnDetached({
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        cwd: '/repo',
        stdoutFd: 12,
        stderrFd: 12,
      });

      expect(result).toStrictEqual({ pid: 4821, pgid: 4821 });
    });

    it('VALID: {stdoutFd, stderrFd, env} => spawns detached, stdin ignored, stdio wired to the given fds', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupSuccess({
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        cwd: '/repo',
        pid: 4821,
      });

      spawnDetached({
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        cwd: '/repo',
        env: { DUNGEONMASTER_PORT: '34172' },
        stdoutFd: 12,
        stderrFd: 13,
      });

      expect(
        proxy.getSpawnedOptions({ command: 'npm', args: ['run', 'dev:no-watch'], cwd: '/repo' }),
      ).toStrictEqual([
        {
          cwd: '/repo',
          env: { DUNGEONMASTER_PORT: '34172' },
          detached: true,
          stdio: ['ignore', 12, 13],
        },
      ]);
    });

    it('VALID: {one command, two arg lists} => each spawn answers its own stage and reads back apart', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupSuccess({
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        cwd: '/repo',
        pid: 4821,
      });
      proxy.setupSuccess({
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/web'],
        cwd: '/repo',
        pid: 4822,
      });

      const server = spawnDetached({
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        cwd: '/repo',
        stdoutFd: 12,
        stderrFd: 12,
      });
      const web = spawnDetached({
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/web'],
        cwd: '/repo',
        stdoutFd: 14,
        stderrFd: 14,
      });

      expect({ server, web }).toStrictEqual({
        server: { pid: 4821, pgid: 4821 },
        web: { pid: 4822, pgid: 4822 },
      });
      expect(proxy.getCallsFor({ command: 'npm' }).map((call) => call[1])).toStrictEqual([
        ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        ['run', 'dev:no-watch', '--workspace=@dungeonmaster/web'],
      ]);
    });

    it('VALID: {same command and args, two cwds} => each cwd answers its own stage', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupSuccess({ command: 'npm', args: ['run', 'dev'], cwd: '/repo-a', pid: 101 });
      proxy.setupSuccess({ command: 'npm', args: ['run', 'dev'], cwd: '/repo-b', pid: 202 });

      const b = spawnDetached({
        command: 'npm',
        args: ['run', 'dev'],
        cwd: '/repo-b',
        stdoutFd: 12,
        stderrFd: 12,
      });

      expect(b).toStrictEqual({ pid: 202, pgid: 202 });
    });
  });

  describe('spawn never started', () => {
    it('ERROR: {spawn produces no pid} => throws, naming the command', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupNoPid({ command: 'nonexistent', args: [], cwd: '/repo' });

      expect(() =>
        spawnDetached({
          command: 'nonexistent',
          args: [],
          cwd: '/repo',
          stdoutFd: 12,
          stderrFd: 12,
        }),
      ).toThrow(
        /^spawnDetached: spawning "nonexistent" produced no pid — the process never started$/u,
      );
    });
  });
});
