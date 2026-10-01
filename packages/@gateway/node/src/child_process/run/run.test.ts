import { run } from './run';
import { runProxy } from './run.proxy';
import { RunNotFoundError } from '../run-not-found.error';

describe('run()', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '' });

      const result = await run({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: '',
        stdout: '',
        stderr: '',
        signal: null,
        timedOut: false,
      });
    });

    it('VALID: {command exits with 0 and stdout} => returns stdout content', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: 'All tests passed', stderr: '' });

      const result = await run({ command: 'npm', args: ['run', 'test'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'All tests passed',
        stdout: 'All tests passed',
        stderr: '',
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
        stdout: '',
        stderr: 'Error in /src/file.ts',
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
        stdout: 'stdout content',
        stderr: 'stderr content',
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
        stdout: 'partial run output',
        stderr: '',
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
        stdout: '',
        stderr: '',
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
        stdout: '',
        stderr: '',
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

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'done',
        stdout: 'done',
        stderr: '',
        signal: null,
        timedOut: false,
      });
      expect(proxy.getKillCallCount({ command: 'npm' })).toBe(0);
    });
  });

  describe('command not found', () => {
    it('ERROR: {spawn ENOENT} => throws RunNotFoundError naming the command and carrying the code', async () => {
      const proxy = runProxy();
      proxy.setupError({
        command: 'nonexistent',
        error: Object.assign(new Error('spawn nonexistent ENOENT'), { code: 'ENOENT' }),
      });

      await expect(
        run({ command: 'nonexistent', args: [], cwd: '/project' }),
      ).rejects.toStrictEqual(
        new RunNotFoundError({
          command: 'nonexistent',
          code: 'ENOENT',
          message: 'spawn nonexistent ENOENT',
        }),
      );
    });
  });

  describe('stdout and stderr kept apart', () => {
    it('VALID: {exit 0, a warning on stderr} => stdout holds only what the command printed on stdout', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'git',
        exitCode: 0,
        stdout: 'export const x = 1;\n',
        stderr: 'warning: CRLF will be replaced by LF in src/x.ts\n',
      });

      const result = await run({ command: 'git', args: ['cat-file', 'blob', 'abc'], cwd: '/repo' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'export const x = 1;\nwarning: CRLF will be replaced by LF in src/x.ts\n',
        stdout: 'export const x = 1;\n',
        stderr: 'warning: CRLF will be replaced by LF in src/x.ts\n',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('multi-byte characters split across chunks', () => {
    it('EDGE: {a two-byte "é" split between two one-byte chunks} => decodes the character intact', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'git',
        exitCode: 0,
        stdout: 'café',
        stderr: 'naïve',
        chunkSize: 1,
      });

      const result = await run({ command: 'git', args: ['cat-file', 'blob', 'abc'], cwd: '/repo' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'cafénaïve',
        stdout: 'café',
        stderr: 'naïve',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('live chunk callbacks', () => {
    it('VALID: {onStdout and onStderr} => each callback receives its own stream text, and the result still holds both', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'node',
        args: ['cli.js', 'unit'],
        cwd: '/repo',
        exitCode: 1,
        stdout: 'src/a.ts  running',
        stderr: 'src/a.ts  0/1 passed',
      });
      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];

      const result = await run({
        command: 'node',
        args: ['cli.js', 'unit'],
        cwd: '/repo',
        onStdout: (chunk) => {
          stdoutChunks.push(chunk);
        },
        onStderr: (chunk) => {
          stderrChunks.push(chunk);
        },
      });

      expect({ stdoutChunks, stderrChunks, result }).toStrictEqual({
        stdoutChunks: ['src/a.ts  running'],
        stderrChunks: ['src/a.ts  0/1 passed'],
        result: {
          exitCode: 1,
          output: 'src/a.ts  runningsrc/a.ts  0/1 passed',
          stdout: 'src/a.ts  running',
          stderr: 'src/a.ts  0/1 passed',
          signal: null,
          timedOut: false,
        },
      });
    });

    it('EDGE: {a two-byte "é" split between two one-byte chunks} => the callback receives the character whole', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'node',
        exitCode: 0,
        stdout: 'café',
        stderr: 'naïve',
        chunkSize: 1,
      });
      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];

      await run({
        command: 'node',
        args: ['cli.js'],
        cwd: '/repo',
        onStdout: (chunk) => {
          stdoutChunks.push(chunk);
        },
        onStderr: (chunk) => {
          stderrChunks.push(chunk);
        },
      });

      expect({ stdoutChunks, stderrChunks }).toStrictEqual({
        stdoutChunks: ['c', 'a', 'f', 'é'],
        stderrChunks: ['n', 'a', 'ï', 'v', 'e'],
      });
    });

    it('EDGE: {stdout ends inside a multi-byte character} => the callback receives the leftover bytes as U+FFFD, matching the result', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'node',
        exitCode: 0,
        // "caf" plus the first byte of "é" (0xC3 0xA9), with the second byte never sent.
        stdout: new Uint8Array([0x63, 0x61, 0x66, 0xc3]),
        stderr: '',
        chunkSize: 1,
      });
      const stdoutChunks: string[] = [];

      const result = await run({
        command: 'node',
        args: ['cli.js'],
        cwd: '/repo',
        onStdout: (chunk) => {
          stdoutChunks.push(chunk);
        },
      });

      expect({ stdoutChunks, stdout: result.stdout }).toStrictEqual({
        stdoutChunks: ['c', 'a', 'f', '\ufffd'],
        stdout: 'caf\ufffd',
      });
    });

    it('EMPTY: {onStdout, a command that prints nothing} => the callback never fires', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'node', exitCode: 0, stdout: '', stderr: '' });
      const stdoutChunks: string[] = [];

      await run({
        command: 'node',
        args: ['cli.js'],
        cwd: '/repo',
        onStdout: (chunk) => {
          stdoutChunks.push(chunk);
        },
      });

      expect(stdoutChunks).toStrictEqual([]);
    });
  });

  describe('stdin', () => {
    it('VALID: {no stdin option} => the child inherits stdin and pipes stdout and stderr', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '' });

      await run({ command: 'npm', args: ['test'], cwd: '/project' });

      expect(proxy.getOptionsFor({ command: 'npm' }).map((options) => options.stdio)).toStrictEqual(
        [['inherit', 'pipe', 'pipe']],
      );
    });

    it("VALID: {stdin: 'ignore'} => the child gets no stdin and pipes stdout and stderr", async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'node', exitCode: 0, stdout: '', stderr: '' });

      await run({ command: 'node', args: ['cli.js'], cwd: '/repo', stdin: 'ignore' });

      expect(
        proxy.getOptionsFor({ command: 'node' }).map((options) => options.stdio),
      ).toStrictEqual([['ignore', 'pipe', 'pipe']]);
    });
  });

  describe('no output at all', () => {
    it('EMPTY: {command prints nothing on either stream} => returns empty output', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'git', exitCode: 0, stdout: '', stderr: '' });

      const result = await run({ command: 'git', args: ['status'], cwd: '/project' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: '',
        stdout: '',
        stderr: '',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('disambiguating repeated calls to the same command', () => {
    it('VALID: {two calls to the same command with different args} => each gets its own staged result', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        exitCode: 0,
        stdout: 'main-sha\n',
        stderr: '',
      });
      proxy.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'master'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: not a valid ref',
      });

      const mainResult = await run({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        cwd: '/project',
      });
      const masterResult = await run({
        command: 'git',
        args: ['rev-parse', '--verify', 'master'],
        cwd: '/project',
      });

      expect(mainResult).toStrictEqual({
        exitCode: 0,
        output: 'main-sha\n',
        stdout: 'main-sha\n',
        stderr: '',
        signal: null,
        timedOut: false,
      });
      expect(masterResult).toStrictEqual({
        exitCode: 1,
        output: 'fatal: not a valid ref',
        stdout: '',
        stderr: 'fatal: not a valid ref',
        signal: null,
        timedOut: false,
      });
    });

    it('VALID: {two calls to the same command and args in different cwds} => each gets its own staged result', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'git',
        args: ['status'],
        cwd: '/repo-a',
        exitCode: 0,
        stdout: 'clean in a\n',
        stderr: '',
      });
      proxy.setupSuccess({
        command: 'git',
        args: ['status'],
        cwd: '/repo-b',
        exitCode: 0,
        stdout: 'clean in b\n',
        stderr: '',
      });

      const resultA = await run({ command: 'git', args: ['status'], cwd: '/repo-a' });
      const resultB = await run({ command: 'git', args: ['status'], cwd: '/repo-b' });

      expect(resultA).toStrictEqual({
        exitCode: 0,
        output: 'clean in a\n',
        stdout: 'clean in a\n',
        stderr: '',
        signal: null,
        timedOut: false,
      });
      expect(resultB).toStrictEqual({
        exitCode: 0,
        output: 'clean in b\n',
        stdout: 'clean in b\n',
        stderr: '',
        signal: null,
        timedOut: false,
      });
    });

    it('VALID: {two calls to the same command with different args, one staged to fail} => only the matching call rejects', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
      proxy.setupError({
        command: 'git',
        args: ['rev-parse', '--verify', 'master'],
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
      });

      const mainResult = await run({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        cwd: '/project',
      });

      await expect(
        run({ command: 'git', args: ['rev-parse', '--verify', 'master'], cwd: '/project' }),
      ).rejects.toStrictEqual(
        new RunNotFoundError({ command: 'git', code: 'ENOENT', message: 'spawn git ENOENT' }),
      );
      expect(mainResult).toStrictEqual({
        exitCode: 0,
        output: '',
        stdout: '',
        stderr: '',
        signal: null,
        timedOut: false,
      });
    });
  });

  describe('reading back spawn options', () => {
    it('VALID: {two calls to the same command with different cwd and env} => getOptionsFor reads back each call, in order', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'jest', exitCode: 0, stdout: '', stderr: '' });

      await run({
        command: 'jest',
        args: ['--json'],
        cwd: '/project-a',
        env: { NODE_OPTIONS: '--conditions=source' },
      });
      await run({
        command: 'jest',
        args: ['--json'],
        cwd: '/project-b',
        env: { CUSTOM_VAR: 'value' },
      });

      const options = proxy.getOptionsFor({ command: 'jest' });

      expect(options[0]?.cwd).toBe('/project-a');
      expect(options[0]?.env.NODE_OPTIONS).toBe('--conditions=source');
      expect(options[1]?.cwd).toBe('/project-b');
      expect(options[1]?.env.CUSTOM_VAR).toBe('value');
      expect(options[2]).toBe(undefined);
    });
  });

  describe('reading back every spawn', () => {
    it('VALID: {two different commands spawned} => getAllSpawnCalls reads back each full call, in order', async () => {
      const proxy = runProxy();
      proxy.setupSuccess({ command: 'git', exitCode: 0, stdout: '', stderr: '' });
      proxy.setupSuccess({ command: 'npm', exitCode: 0, stdout: '', stderr: '' });

      await run({ command: 'git', args: ['status'], cwd: '/project-a' });
      await run({ command: 'npm', args: ['install'], cwd: '/project-b' });

      expect(
        proxy
          .getAllSpawnCalls()
          .map(([command, args, options]) => [command, args, (options as { cwd: string }).cwd]),
      ).toStrictEqual([
        ['git', ['status'], '/project-a'],
        ['npm', ['install'], '/project-b'],
      ]);
    });

    it('EMPTY: {nothing spawned} => getAllSpawnCalls returns an empty list', () => {
      const proxy = runProxy();

      expect(proxy.getAllSpawnCalls()).toStrictEqual([]);
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
