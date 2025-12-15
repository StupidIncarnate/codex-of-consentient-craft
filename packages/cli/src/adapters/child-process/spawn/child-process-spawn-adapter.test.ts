import { childProcessSpawnAdapter } from './child-process-spawn-adapter';
import { childProcessSpawnAdapterProxy } from './child-process-spawn-adapter.proxy';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

describe('childProcessSpawnAdapter', () => {
  describe('valid spawns', () => {
    it('VALID: {command: "claude", args: ["--help"], options: {stdio: "inherit"}} => spawns child process', () => {
      const proxy = childProcessSpawnAdapterProxy();
      proxy.setupSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = childProcessSpawnAdapter({
        command: 'claude',
        args: ['--help'],
        options: { stdio: 'inherit' },
      });

      expect(result).toBeDefined();
      expect(typeof result.on).toBe('function');
    });

    it('VALID: {command: "node", args: ["-v"]} => spawns child process without options', () => {
      const proxy = childProcessSpawnAdapterProxy();
      proxy.setupSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = childProcessSpawnAdapter({
        command: 'node',
        args: ['-v'],
      });

      expect(result).toBeDefined();
      expect(typeof result.on).toBe('function');
    });

    it('VALID: {command: "npm", args: ["test", "--", "path/to/test.ts"], options: {cwd: "/project"}} => spawns with cwd', () => {
      const proxy = childProcessSpawnAdapterProxy();
      proxy.setupSuccess({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = childProcessSpawnAdapter({
        command: 'npm',
        args: ['test', '--', 'path/to/test.ts'],
        options: { cwd: '/project' },
      });

      expect(result).toBeDefined();
      expect(typeof result.on).toBe('function');
    });
  });

  describe('exit events', () => {
    it('VALID: child process emits exit event with code 0 => resolves successfully', async () => {
      const proxy = childProcessSpawnAdapterProxy();
      const expectedExitCode = ExitCodeStub({ value: 0 });
      proxy.setupSuccess({ exitCode: expectedExitCode });

      const child = childProcessSpawnAdapter({
        command: 'claude',
        args: ['--help'],
      });

      const receivedCode = await new Promise<unknown>((resolve) => {
        child.on('exit', (code) => {
          resolve(code);
        });
      });

      expect(receivedCode).toBe(expectedExitCode);
    });

    it('VALID: child process emits exit event with code 1 => resolves with error code', async () => {
      const proxy = childProcessSpawnAdapterProxy();
      const expectedExitCode = ExitCodeStub({ value: 1 });
      proxy.setupSuccess({ exitCode: expectedExitCode });

      const child = childProcessSpawnAdapter({
        command: 'claude',
        args: ['--invalid'],
      });

      const receivedCode = await new Promise<unknown>((resolve) => {
        child.on('exit', (code) => {
          resolve(code);
        });
      });

      expect(receivedCode).toBe(expectedExitCode);
    });
  });

  describe('error events', () => {
    it('ERROR: child process emits error event => rejects with error', async () => {
      const proxy = childProcessSpawnAdapterProxy();
      const testError = new Error('ENOENT: command not found');
      proxy.setupError({ error: testError });

      const child = childProcessSpawnAdapter({
        command: 'nonexistent-command',
        args: [],
      });

      const receivedError = await new Promise<Error>((resolve) => {
        child.on('error', (error) => {
          resolve(error);
        });
      });

      expect(receivedError).toBe(testError);
    });
  });
});
