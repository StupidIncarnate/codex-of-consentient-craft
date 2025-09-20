import { spawnPromise } from './spawn-promise';

describe('spawnPromise', () => {
  describe('valid command execution', () => {
    it('VALID: {command: "echo", args: ["hello"]} => returns {code: 0, stdout: "hello\\n", stderr: ""}', async () => {
      const result = await spawnPromise({
        command: 'echo',
        args: ['hello'],
      });

      expect(result).toStrictEqual({
        code: 0,
        stdout: 'hello\n',
        stderr: '',
      });
    });

    it('VALID: {command: "echo", args: ["test"], cwd: "/tmp"} => returns result with correct output', async () => {
      const result = await spawnPromise({
        command: 'echo',
        args: ['test'],
        cwd: '/tmp',
      });

      expect(result).toStrictEqual({
        code: 0,
        stdout: 'test\n',
        stderr: '',
      });
    });

    it('VALID: {command: "cat", args: [], stdin: "input text"} => returns stdin content in stdout', async () => {
      const result = await spawnPromise({
        command: 'cat',
        args: [],
        stdin: 'input text',
      });

      expect(result).toStrictEqual({
        code: 0,
        stdout: 'input text',
        stderr: '',
      });
    });

    it('VALID: {command: "node", args: ["-e", "process.exit(2)"]} => returns {code: 2, stdout: "", stderr: ""}', async () => {
      const result = await spawnPromise({
        command: 'node',
        args: ['-e', 'process.exit(2)'],
      });

      expect(result).toStrictEqual({
        code: 2,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('command failures', () => {
    it('INVALID_COMMAND: {command: "nonexistent-command", args: []} => returns {code: 1, stdout: "", stderr: error message}', async () => {
      const result = await spawnPromise({
        command: 'nonexistent-command-12345',
        args: [],
      });

      expect(result).toStrictEqual({
        code: 1,
        stdout: '',
        stderr: 'spawn nonexistent-command-12345 ENOENT',
      });
    });
  });

  describe('system errors', () => {
    it('ERROR: {command: "sleep", args: ["5"], timeout: 100} => throws "Process timed out after 100ms"', async () => {
      await expect(
        spawnPromise({
          command: 'sleep',
          args: ['5'],
          timeout: 100,
        }),
      ).rejects.toThrow('Process timed out after 100ms');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {command: "echo", args: []} => returns {code: 0, stdout: "\\n", stderr: ""}', async () => {
      const result = await spawnPromise({
        command: 'echo',
        args: [],
      });

      expect(result).toStrictEqual({
        code: 0,
        stdout: '\n',
        stderr: '',
      });
    });

    it('EDGE: {command: "node", args: ["-e", "console.error(\\"error\\"); process.exit(1)"]} => returns {code: 1, stdout: "", stderr: "error\\n"}', async () => {
      const result = await spawnPromise({
        command: 'node',
        args: ['-e', 'console.error("error"); process.exit(1)'],
      });

      expect(result).toStrictEqual({
        code: 1,
        stdout: '',
        stderr: 'error\n',
      });
    });

    it('EDGE: {command: "echo", args: [""], timeout: 5000} => completes before timeout', async () => {
      const result = await spawnPromise({
        command: 'echo',
        args: [''],
        timeout: 5000,
      });

      expect(result).toStrictEqual({
        code: 0,
        stdout: '\n',
        stderr: '',
      });
    });
  });

  describe('empty input cases', () => {
    it('EMPTY: {command: "true", args: [], stdin: ""} => returns {code: 0, stdout: "", stderr: ""}', async () => {
      const result = await spawnPromise({
        command: 'true',
        args: [],
        stdin: '',
      });

      expect(result).toStrictEqual({
        code: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('EMPTY: {command: "echo", args: ["test"], cwd: undefined} => uses process.cwd() as default', async () => {
      const result = await spawnPromise({
        command: 'echo',
        args: ['test'],
        cwd: undefined,
      });

      expect(result).toStrictEqual({
        code: 0,
        stdout: 'test\n',
        stderr: '',
      });
    });
  });
});
