import {
  lintContent,
  parseEslintOutput,
  extractContentFromToolInput,
  handlePostToolUse,
  handlePreToolUse,
} from './eslint-hook';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { readFile, writeFile } from 'fs/promises';
import type { ChildProcess } from 'child_process';
import type { PreToolUseHookData, PostToolUseHookData, ToolInput } from './eslint-hook';

jest.mock('child_process');
jest.mock('fs/promises');

type MockProcess = {
  stdin: {
    write: jest.Mock;
    end: jest.Mock;
  };
  stdout: EventEmitter;
  stderr: EventEmitter;
  on: jest.Mock;
  emit: jest.Mock;
};

describe('eslint-hook', () => {
  const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
  const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
  const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
  let mockProcess: MockProcess;
  let originalExit: typeof process.exit;
  let exitCode: number | undefined;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    exitCode = undefined;
    originalExit = process.exit.bind(process);
    process.exit = jest.fn((code?: number) => {
      exitCode = code;
      throw new Error(`Process exited with code ${code}`);
    }) as never;

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const emitter = new EventEmitter();
    mockProcess = {
      stdin: {
        write: jest.fn(),
        end: jest.fn(),
      },
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      on: jest.fn(emitter.on.bind(emitter)),
      emit: jest.fn(emitter.emit.bind(emitter)),
    };

    mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);
  });

  afterEach(() => {
    process.exit = originalExit;
    consoleErrorSpy.mockRestore();
  });

  describe('extractContentFromToolInput()', () => {
    it('returns content for Write tool', () => {
      expect(
        extractContentFromToolInput({
          file_path: 'test.ts',
          content: 'test content',
        }),
      ).toBe('test content');
    });

    it('returns new_string for Edit tool', () => {
      expect(
        extractContentFromToolInput({
          file_path: 'test.ts',
          old_string: 'old',
          new_string: 'new',
        }),
      ).toBe('new');
    });

    it('returns new_string from last edit for MultiEdit tool', () => {
      expect(
        extractContentFromToolInput({
          file_path: 'test.ts',
          edits: [
            { old_string: 'old1', new_string: 'new1' },
            { old_string: 'old2', new_string: 'new2' },
          ],
        }),
      ).toBe('new2');
    });

    it('returns null when MultiEdit has empty edits array', () => {
      expect(
        extractContentFromToolInput({
          file_path: 'test.ts',
          edits: [],
        }),
      ).toBeNull();
    });
  });

  describe('parseEslintOutput()', () => {
    it('parses valid JSON output', () => {
      const output =
        'Some text before [{"messages": [{"line": 1, "message": "error"}]}] some text after';
      expect(parseEslintOutput(output)).toStrictEqual([
        { messages: [{ line: 1, message: 'error' }] },
      ]);
    });

    it('parses multiline JSON output', () => {
      const output = `Some text before 
[{
  "messages": [{
    "line": 1, 
    "message": "error"
  }]
}] 
some text after`;
      expect(parseEslintOutput(output)).toStrictEqual([
        { messages: [{ line: 1, message: 'error' }] },
      ]);
    });

    it('returns empty array when no JSON found', () => {
      expect(parseEslintOutput('no json here')).toStrictEqual([]);
    });

    it('returns empty array on parse error', () => {
      expect(parseEslintOutput('[{invalid json}]')).toStrictEqual([]);
    });
  });

  describe('lintContent()', () => {
    describe('when content is empty', () => {
      it('exits with code 0', async () => {
        await expect(lintContent('test.ts', '', false)).rejects.toThrow(
          'Process exited with code 0',
        );
        expect(exitCode).toBe(0);
        expect(mockSpawn).not.toHaveBeenCalled();
      });
    });

    describe('in validation mode (shouldFix = false)', () => {
      describe('when file is not lintable', () => {
        it('exits with code 0 when stderr contains "No files matching"', async () => {
          const lintPromise = lintContent('test.md', 'content', false);

          setTimeout(() => {
            mockProcess.stderr.emit('data', 'No files matching');
            mockProcess.emit('close', 0);
          }, 10);

          await expect(lintPromise).rejects.toThrow('Process exited with code 0');
          expect(exitCode).toBe(0);
        });
      });

      describe('when content has no errors', () => {
        it('exits with code 0', async () => {
          const lintPromise = lintContent('test.ts', 'const x = 1;', false);

          setTimeout(() => {
            // First call - fix dry run
            mockProcess.stdout.emit('data', '[{"messages": []}]');
            mockProcess.emit('close', 0);

            // Create new process for second call
            const emitter2 = new EventEmitter();
            mockProcess = {
              stdin: { write: jest.fn(), end: jest.fn() },
              stdout: new EventEmitter(),
              stderr: new EventEmitter(),
              on: jest.fn(emitter2.on.bind(emitter2)),
              emit: jest.fn(emitter2.emit.bind(emitter2)),
            };
            mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

            setTimeout(() => {
              // Second call - validation
              mockProcess.stdout.emit('data', '[{"messages": []}]');
              mockProcess.emit('close', 0);
            }, 10);
          }, 10);

          await expect(lintPromise).rejects.toThrow('Process exited with code 0');
          expect(exitCode).toBe(0);
        });
      });

      describe('when content has errors', () => {
        it('exits with code 2 and shows error summary', async () => {
          const lintPromise = lintContent('test.ts', 'const x = ;', false);

          setTimeout(() => {
            // First call - fix dry run
            mockProcess.stdout.emit('data', '[{"messages": []}]');
            mockProcess.emit('close', 0);

            // Create new process for second call
            const emitter2 = new EventEmitter();
            mockProcess = {
              stdin: { write: jest.fn(), end: jest.fn() },
              stdout: new EventEmitter(),
              stderr: new EventEmitter(),
              on: jest.fn(emitter2.on.bind(emitter2)),
              emit: jest.fn(emitter2.emit.bind(emitter2)),
            };
            mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

            setTimeout(() => {
              // Second call - validation fails
              mockProcess.stdout.emit(
                'data',
                JSON.stringify([
                  {
                    messages: [
                      { line: 1, message: 'Unexpected token', severity: 2 },
                      { line: 2, message: 'Missing semicolon', severity: 2 },
                    ],
                  },
                ]),
              );
              mockProcess.emit('close', 1);
            }, 10);
          }, 10);

          await expect(lintPromise).rejects.toThrow('Process exited with code 2');
          expect(exitCode).toBe(2);
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Lint found 2 error(s) in test.ts:'),
          );
        });
      });
    });

    describe('in fix mode (shouldFix = true)', () => {
      it('returns fixed content when fixes are available', async () => {
        const lintPromise = lintContent('test.ts', 'const x=1', true);

        setTimeout(() => {
          mockProcess.stdout.emit('data', '[{"messages": [], "output": "const x = 1;"}]');
          mockProcess.emit('close', 0);
        }, 10);

        const result = await lintPromise;
        expect(result).toBe('const x = 1;');
      });

      it('returns original content when no fixes needed', async () => {
        const lintPromise = lintContent('test.ts', 'const x = 1;', true);

        setTimeout(() => {
          mockProcess.stdout.emit('data', '[{"messages": []}]');
          mockProcess.emit('close', 0);
        }, 10);

        const result = await lintPromise;
        expect(result).toBe('const x = 1;');
      });

      it('returns original content when file is not lintable', async () => {
        const lintPromise = lintContent('test.md', 'content', true);

        setTimeout(() => {
          mockProcess.stderr.emit('data', 'No files matching');
          mockProcess.emit('close', 0);
        }, 10);

        const result = await lintPromise;
        expect(result).toBe('content');
      });
    });
  });

  describe('handlePreToolUse()', () => {
    const createHookData = (toolInput: unknown): PreToolUseHookData => ({
      session_id: 'test-session',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: '/test/dir',
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: toolInput as ToolInput,
    });

    it('processes Write tool input correctly', async () => {
      const hookData = createHookData({
        file_path: 'test.ts',
        content: 'const x = 1;',
      });

      const handlePromise = handlePreToolUse(hookData);

      setTimeout(() => {
        // Fix dry run
        mockProcess.stdout.emit('data', '[{"messages": []}]');
        mockProcess.emit('close', 0);

        // Create new process
        const emitter2 = new EventEmitter();
        mockProcess = {
          stdin: { write: jest.fn(), end: jest.fn() },
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          on: jest.fn(emitter2.on.bind(emitter2)),
          emit: jest.fn(emitter2.emit.bind(emitter2)),
        };
        mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

        setTimeout(() => {
          // Validation
          mockProcess.stdout.emit('data', '[{"messages": []}]');
          mockProcess.emit('close', 0);
        }, 10);
      }, 10);

      await expect(handlePromise).rejects.toThrow('Process exited with code 0');
      expect(exitCode).toBe(0);
    });

    it('exits when no file path provided', async () => {
      const hookData = createHookData({
        content: 'const x = 1;',
      });

      await expect(handlePreToolUse(hookData)).rejects.toThrow('Process exited with code 0');
      expect(exitCode).toBe(0);
    });

    it('exits when no content extracted', async () => {
      const hookData = createHookData({
        file_path: 'test.ts',
        edits: [],
      });

      await expect(handlePreToolUse(hookData)).rejects.toThrow('Process exited with code 0');
      expect(exitCode).toBe(0);
    });
  });

  describe('handlePostToolUse()', () => {
    const createHookData = (toolInput: unknown): PostToolUseHookData => ({
      session_id: 'test-session',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: '/test/dir',
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: toolInput as ToolInput,
    });

    beforeEach(() => {
      mockReadFile.mockResolvedValue('const x=1');

      // Also provide a default response that includes file name
      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);
      mockWriteFile.mockResolvedValue(undefined);
    });

    it('reads file, fixes content, and writes back', async () => {
      const hookData = createHookData({
        file_path: '/test/file.ts',
      });

      const handlePromise = handlePostToolUse(hookData);

      // Wait for readFile to be called and resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Wait a bit for the eslint process to start
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Emit the eslint response with npm output prefix
      mockProcess.stdout.emit(
        'data',
        `
> questmaestro@0.1.0-beta.1 eslint
> eslint --stdin --stdin-filename /test/file.ts --fix --format json

${JSON.stringify([
  {
    filePath: '/test/file.ts',
    messages: [],
    output: 'const x = 1;',
  },
])}`,
      );
      mockProcess.emit('close', 0);

      try {
        await handlePromise;
      } catch (_e) {
        // Expected to throw
      }

      expect(mockReadFile).toHaveBeenCalledWith('/test/file.ts', 'utf-8');
      expect(mockWriteFile).toHaveBeenCalledWith('/test/file.ts', 'const x = 1;', 'utf-8');
      expect(exitCode).toBe(0);
    });

    it('does not write when content unchanged', async () => {
      mockReadFile.mockResolvedValue('const x = 1;');

      const hookData = createHookData({
        file_path: '/test/file.ts',
      });

      const handlePromise = handlePostToolUse(hookData);

      // Wait for readFile to be called and resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Wait a bit for the eslint process to start
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Emit the eslint response with npm output prefix
      mockProcess.stdout.emit(
        'data',
        `
> questmaestro@0.1.0-beta.1 eslint
> eslint --stdin --stdin-filename /test/file.ts --fix --format json

${JSON.stringify([
  {
    filePath: '/test/file.ts',
    messages: [],
  },
])}`,
      );
      mockProcess.emit('close', 0);

      try {
        await handlePromise;
      } catch (_e) {
        // Expected to throw
      }
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.ts', 'utf-8');
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(exitCode).toBe(0);
    });

    it('exits gracefully when file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const hookData = createHookData({
        file_path: '/test/nonexistent.ts',
      });

      await expect(handlePostToolUse(hookData)).rejects.toThrow('Process exited with code 0');
      expect(exitCode).toBe(0);
    });

    it('exits with error for other file errors', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'));

      const hookData = createHookData({
        file_path: '/test/file.ts',
      });

      await expect(handlePostToolUse(hookData)).rejects.toThrow('Process exited with code 1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading/writing file: Permission denied');
      expect(exitCode).toBe(1);
    });

    it('exits when no file path provided', async () => {
      const hookData = createHookData({});

      await expect(handlePostToolUse(hookData)).rejects.toThrow('Process exited with code 0');
      expect(mockReadFile).not.toHaveBeenCalled();
      expect(exitCode).toBe(0);
    });
  });
});
