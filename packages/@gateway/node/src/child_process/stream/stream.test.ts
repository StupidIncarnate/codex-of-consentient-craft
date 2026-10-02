import { stream } from './stream';
import { streamProxy } from './stream.proxy';
import { RunNotFoundError } from '../run-not-found.error';

describe('stream()', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '' });

      const result = await stream({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null });
    });

    it('VALID: {command exits with 0 and stdout} => returns stdout content', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: 'All tests passed', stderr: '' });

      const result = await stream({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 0, output: 'All tests passed', signal: null });
    });
  });

  describe('non-zero exit', () => {
    it('INVALID: {command exits with non-zero} => returns that exit code and stdout content', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 1, stdout: 'run: 123', stderr: 'boom' });

      const result = await stream({ command: 'npm', args: ['run', 'lint'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 1, output: 'run: 123', signal: null });
    });
  });

  describe('killed by signal', () => {
    it('ERROR: {child killed by SIGTERM} => reports null exit code alongside the signal', async () => {
      const proxy = streamProxy();
      proxy.setupSignalKill({ command: 'playwright', signal: 'SIGTERM', stdout: 'partial' });

      const result = await stream({ command: 'playwright', args: ['test'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: null, output: 'partial', signal: 'SIGTERM' });
    });
  });

  describe('stderr streaming', () => {
    it('VALID: {stderr output with onStderr} => forwards stderr live, keeps it out of output', async () => {
      const proxy = streamProxy();
      const stderrChunks: string[] = [];
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: 'lint output line' });

      const result = await stream({
        command: 'npm',
        args: ['run', 'lint'],
        cwd: '/project',
        onStderr: (chunk: string) => {
          stderrChunks.push(chunk);
        },
      });

      expect(stderrChunks).toStrictEqual(['lint output line']);
      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null });
    });

    it('VALID: {stderr output without onStderr} => does not throw', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: 'some stderr' });

      const result = await stream({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null });
    });
  });

  describe('command not found', () => {
    it('ERROR: {spawn ENOENT} => throws RunNotFoundError naming the command and carrying the code', async () => {
      const proxy = streamProxy();
      proxy.setupError({
        command: 'nonexistent',
        error: Object.assign(new Error('spawn nonexistent ENOENT'), { code: 'ENOENT' }),
      });

      await expect(
        stream({ command: 'nonexistent', args: [], cwd: '/project' }),
      ).rejects.toStrictEqual(
        new RunNotFoundError({
          command: 'nonexistent',
          code: 'ENOENT',
          message: 'spawn nonexistent ENOENT',
        }),
      );
    });
  });

  describe('no output at all', () => {
    it('EMPTY: {process closes with null code and no output} => returns empty output', async () => {
      const proxy = streamProxy();
      proxy.setupCloseNull({ command: 'npm', stdout: '' });

      const result = await stream({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: null, output: '', signal: null });
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {command, args, cwd} => passes args through to spawn', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '' });

      await stream({ command: 'npm', args: ['run', 'ward:all'], cwd: '/home/user/project' });

      expect(proxy.getSpawnedArgs({ command: 'npm' })).toStrictEqual(['run', 'ward:all']);
    });
  });

  describe('repeated calls to the same command', () => {
    it('VALID: {one child spawned per package, same command, different args} => getCallsFor reads back every call, in order', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'dungeonmaster-ward', exitCode: 0, stdout: '', stderr: '' });

      await stream({
        command: 'dungeonmaster-ward',
        args: ['run', '--only', 'unit'],
        cwd: '/repo/packages/hooks',
      });
      await stream({
        command: 'dungeonmaster-ward',
        args: ['run', '--only', 'unit', '--', 'src/foo.ts'],
        cwd: '/repo/packages/ward',
      });

      expect(proxy.getCallsFor({ command: 'dungeonmaster-ward' })).toStrictEqual([
        ['run', '--only', 'unit'],
        ['run', '--only', 'unit', '--', 'src/foo.ts'],
      ]);
      expect(proxy.getSpawnedCwds({ command: 'dungeonmaster-ward' })).toStrictEqual([
        '/repo/packages/hooks',
        '/repo/packages/ward',
      ]);
    });
  });

  describe('onSpawn callback', () => {
    it('VALID: {onSpawn callback provided} => invokes onSpawn with child pid immediately upon spawn', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '', pid: 4821 });

      const spawnedPids: number[] = [];
      const result = await stream({
        command: 'npm',
        args: ['run', 'test'],
        cwd: '/project',
        onSpawn: ({ pid }: { pid: number }) => {
          spawnedPids.push(pid);
        },
      });

      expect(spawnedPids).toStrictEqual([4821]);
      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null });
    });

    it('VALID: {onSpawn omitted} => executes without invoking callback', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({
        command: 'npm',
        exitCode: 0,
        stdout: 'success output',
        stderr: '',
        pid: 4821,
      });

      const result = await stream({
        command: 'npm',
        args: ['run', 'test'],
        cwd: '/project',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: 'success output', signal: null });
    });

    it('EDGE: {child pid is undefined} => does not invoke onSpawn', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '', pid: null });

      const spawnedPids: number[] = [];
      const result = await stream({
        command: 'npm',
        args: ['run', 'test'],
        cwd: '/project',
        onSpawn: ({ pid }: { pid: number }) => {
          spawnedPids.push(pid);
        },
      });

      expect(spawnedPids).toStrictEqual([]);
      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null });
    });

    it('VALID: {onSpawn, onStderr and stdout} => invokes onSpawn and forwards stderr while buffering stdout', async () => {
      const proxy = streamProxy();
      proxy.setupSuccess({
        command: 'npm',
        exitCode: 0,
        stdout: 'captured stdout',
        stderr: 'live stderr',
        pid: 7777,
      });

      const spawnedPids: number[] = [];
      const stderrChunks: string[] = [];
      const result = await stream({
        command: 'npm',
        args: ['run', 'build'],
        cwd: '/project',
        onStderr: (chunk: string) => {
          stderrChunks.push(chunk);
        },
        onSpawn: ({ pid }: { pid: number }) => {
          spawnedPids.push(pid);
        },
      });

      expect(spawnedPids).toStrictEqual([7777]);
      expect(stderrChunks).toStrictEqual(['live stderr']);
      expect(result).toStrictEqual({ exitCode: 0, output: 'captured stdout', signal: null });
    });

    it('ERROR: {onSpawn provided and spawn emits error} => invokes onSpawn with pid before rejecting', async () => {
      const proxy = streamProxy();
      proxy.setupError({
        command: 'failing-cmd',
        error: Object.assign(new Error('spawn failing-cmd ENOENT'), { code: 'ENOENT' }),
        pid: 8888,
      });

      const spawnedPids: number[] = [];

      await expect(
        stream({
          command: 'failing-cmd',
          args: [],
          cwd: '/project',
          onSpawn: ({ pid }: { pid: number }) => {
            spawnedPids.push(pid);
          },
        }),
      ).rejects.toStrictEqual(
        new RunNotFoundError({
          command: 'failing-cmd',
          code: 'ENOENT',
          message: 'spawn failing-cmd ENOENT',
        }),
      );

      expect(spawnedPids).toStrictEqual([8888]);
    });
  });
});
