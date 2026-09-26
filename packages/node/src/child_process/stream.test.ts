import { stream } from './stream';
import { streamProxy } from './stream.proxy';

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
    it('ERROR: {spawn error without a numeric code} => returns exit code 1 and collected stdout', async () => {
      const proxy = streamProxy();
      proxy.setupError({ command: 'nonexistent', error: new Error('ENOENT: not found') });

      const result = await stream({ command: 'nonexistent', args: [], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 1, output: '', signal: null });
    });

    it('ERROR: {spawn error with a numeric code} => returns that exit code', async () => {
      const proxy = streamProxy();
      proxy.setupErrorWithCode({
        command: 'nonexistent',
        error: new Error('ENOENT'),
        exitCode: 127,
      });

      const result = await stream({ command: 'nonexistent', args: [], cwd: '/project' });

      expect(result).toStrictEqual({ exitCode: 127, output: '', signal: null });
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
});
