import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnDetachedAdapter } from './child-process-spawn-detached-adapter';
import { childProcessSpawnDetachedAdapterProxy } from './child-process-spawn-detached-adapter.proxy';

describe('childProcessSpawnDetachedAdapter', () => {
  describe('spawn options', () => {
    it('VALID: {stdoutFd: 11, stderrFd: 12} => spawns detached with those stdio fds', () => {
      const proxy = childProcessSpawnDetachedAdapterProxy();
      const command = 'npm';
      const args = ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'];
      const cwd = AbsoluteFilePathStub({ value: '/repo' });
      proxy.succeeds({ command, args, pid: 54_321 });

      childProcessSpawnDetachedAdapter({ command, args, cwd, stdoutFd: 11, stderrFd: 12 });

      expect(proxy.getOptionsFor({ command, args })).toStrictEqual({
        cwd,
        env: undefined,
        detached: true,
        stdio: ['ignore', 11, 12],
      });
    });

    it('VALID: {env: {DUNGEONMASTER_PORT: "34172"}} => passes that env object through to spawn', () => {
      const proxy = childProcessSpawnDetachedAdapterProxy();
      const command = 'npm';
      const args = ['run', 'dev'];
      const cwd = AbsoluteFilePathStub({ value: '/repo' });
      proxy.succeeds({ command, args, pid: 54_321 });

      childProcessSpawnDetachedAdapter({
        command,
        args,
        cwd,
        env: { DUNGEONMASTER_PORT: '34172' },
        stdoutFd: 3,
        stderrFd: 4,
      });

      expect(proxy.getOptionsFor({ command, args })).toStrictEqual({
        cwd,
        env: { DUNGEONMASTER_PORT: '34172' },
        detached: true,
        stdio: ['ignore', 3, 4],
      });
    });
  });

  describe('letting the parent exit', () => {
    it('VALID: {a spawned long-lived child} => unrefs the handle so the parent process can exit', () => {
      const proxy = childProcessSpawnDetachedAdapterProxy();
      const command = 'node';
      const args = ['/repo/packages/cli/dist/bin/dungeonmaster.js', 'siegelense', 'driver'];
      const cwd = AbsoluteFilePathStub({ value: '/repo' });
      proxy.succeeds({ command, args, pid: 54_321 });

      childProcessSpawnDetachedAdapter({ command, args, cwd, stdoutFd: 3, stderrFd: 4 });

      expect(proxy.unrefedPids()).toStrictEqual(['54321']);
    });

    it('ERROR: {spawn produced no pid} => never unrefs, because there is no live child to release', () => {
      const proxy = childProcessSpawnDetachedAdapterProxy();
      const command = 'npm';
      const args = ['run', 'dev'];
      const cwd = AbsoluteFilePathStub({ value: '/repo' });
      proxy.succeedsWithNoPid({ command, args });

      expect(() =>
        childProcessSpawnDetachedAdapter({ command, args, cwd, stdoutFd: 3, stderrFd: 4 }),
      ).toThrow(/produced no pid/u);
      expect(proxy.unrefedPids()).toStrictEqual([]);
    });
  });

  describe('the returned identifiers', () => {
    it('VALID: {child.pid: 54321} => returns pid and pgid both derived from the OS pid', () => {
      const proxy = childProcessSpawnDetachedAdapterProxy();
      const command = 'npm';
      const args = ['run', 'dev'];
      const cwd = AbsoluteFilePathStub({ value: '/repo' });
      proxy.succeeds({ command, args, pid: 54_321 });

      const result = childProcessSpawnDetachedAdapter({
        command,
        args,
        cwd,
        stdoutFd: 3,
        stderrFd: 4,
      });

      expect(result).toStrictEqual({ pid: '54321', pgid: 54_321 });
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {spawn produced no pid} => throws naming the command', () => {
      const proxy = childProcessSpawnDetachedAdapterProxy();
      const command = 'npm';
      const args = ['run', 'dev'];
      const cwd = AbsoluteFilePathStub({ value: '/repo' });
      proxy.succeedsWithNoPid({ command, args });

      expect(() =>
        childProcessSpawnDetachedAdapter({ command, args, cwd, stdoutFd: 3, stderrFd: 4 }),
      ).toThrow(/produced no pid/u);
    });
  });
});
