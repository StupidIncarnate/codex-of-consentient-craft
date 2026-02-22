import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamAdapter } from './child-process-spawn-stream-adapter';
import { childProcessSpawnStreamAdapterProxy } from './child-process-spawn-stream-adapter.proxy';

describe('childProcessSpawnStreamAdapter', () => {
  describe('successful execution', () => {
    it('VALID: {command exits with 0} => returns exit code 0 and empty output', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: '', stderr: '' });

      const result = await childProcessSpawnStreamAdapter({
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
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: 'All tests passed', stderr: '' });

      const result = await childProcessSpawnStreamAdapter({
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
    it('VALID: {command exits with non-zero} => returns exit code and stdout content', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({ exitCode, stdout: 'run: 123-abc\n', stderr: 'Error in /src/file.ts' });

      const result = await childProcessSpawnStreamAdapter({
        command: 'npm',
        args: ['run', 'lint'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'run: 123-abc\n',
      });
    });
  });

  describe('stderr streaming', () => {
    it('VALID: {stderr output with onStderr callback} => calls onStderr with stderr content', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const stderrLines = [] as unknown[];
      proxy.setupSuccess({ exitCode, stdout: '', stderr: 'lint output line' });

      await childProcessSpawnStreamAdapter({
        command: 'npm',
        args: ['run', 'lint'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onStderr: (line: string) => {
          stderrLines.push(line);
        },
      });

      expect(stderrLines).toStrictEqual(['lint output line']);
    });

    it('VALID: {stderr output without onStderr callback} => does not throw', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: '', stderr: 'some stderr' });

      const result = await childProcessSpawnStreamAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: '',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {spawn error without code} => returns exit code 1 and collected stdout', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      proxy.setupError({ error: new Error('ENOENT: command not found') });

      const result = await childProcessSpawnStreamAdapter({
        command: 'nonexistent',
        args: [],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: '',
      });
    });

    it('ERROR: {spawn error with numeric code} => returns that exit code', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 127 });
      proxy.setupErrorWithCode({ error: new Error('ENOENT'), exitCode });

      const result = await childProcessSpawnStreamAdapter({
        command: 'nonexistent',
        args: [],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 127,
        output: '',
      });
    });

    it('ERROR: {spawn error with prior stdout} => returns collected stdout in output', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      proxy.setupError({ error: new Error('killed'), stdout: 'partial output' });

      const result = await childProcessSpawnStreamAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: 'partial output',
      });
    });
  });

  describe('close with null code', () => {
    it('VALID: {process killed with null exit code} => returns null exit code and stdout', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      proxy.setupCloseNull({ stdout: 'some output' });

      const result = await childProcessSpawnStreamAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: null,
        output: 'some output',
      });
    });
  });

  describe('multiple stdout chunks', () => {
    it('VALID: {stdout arrives in multiple chunks} => joins all chunks into single output', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccessMultiChunk({
        exitCode,
        stdoutChunks: ['chunk-one', '-chunk-two', '-chunk-three'],
        stderr: '',
      });

      const result = await childProcessSpawnStreamAdapter({
        command: 'npm',
        args: ['run', 'test'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: 'chunk-one-chunk-two-chunk-three',
      });
    });
  });

  describe('spawn arguments', () => {
    it('VALID: {command, args, cwd} => passes correct arguments to spawn', async () => {
      const proxy = childProcessSpawnStreamAdapterProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode, stdout: '', stderr: '' });

      await childProcessSpawnStreamAdapter({
        command: 'npm',
        args: ['run', 'ward:all'],
        cwd: AbsoluteFilePathStub({ value: '/home/user/project' }),
      });

      expect(proxy.getSpawnedCommand()).toBe('npm');
      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', 'ward:all']);
      expect(proxy.getSpawnedCwd()).toBe('/home/user/project');
    });
  });
});
