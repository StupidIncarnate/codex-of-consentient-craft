import { lintContent } from './lint-content';
import { ProcessUtil } from '../process/process-util';
import { ChildProcessMocker } from '@questmaestro/testing';

describe('lintContent', () => {
  describe('valid input', () => {
    it("VALID: {filePath: 'test.ts', content: 'const x = 1;'} => returns fixed content and results", async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout: '[{"messages":[]}]',
          stderr: '',
        },
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it("VALID: {filePath: 'test.js', content: 'valid code'} => returns original content when no fixes", async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout: '[{"messages":[]}]',
          stderr: '',
        },
      });

      const filePath = 'test.js';
      const content = 'valid code';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'valid code',
        fixResults: [],
      });
    });

    it('VALID: eslint returns fixed output => returns fixed content', async () => {
      jest.spyOn(ProcessUtil, 'spawnPromise').mockResolvedValue({
        code: 0,
        stdout: '[{"filePath":"test.ts","messages":[],"output":"const x = 1;\\n"}]',
        stderr: '',
      });

      const filePath = 'test.ts';
      const content = 'const x=1';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;\n',
        fixResults: [{ filePath: 'test.ts', messages: [], output: 'const x = 1;\n' }],
      });
    });

    it('VALID: exit code 0 with no ESLint output => returns original content', async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout: '',
          stderr: '',
        },
      });

      const filePath = 'test.txt';
      const content = 'plain text file';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'plain text file',
        fixResults: [],
      });
    });

    it('VALID: ESLint fix-dry-run returns multiple messages => processes all messages', async () => {
      jest.spyOn(ProcessUtil, 'spawnPromise').mockResolvedValue({
        code: 0,
        stdout:
          '[{"filePath":"test.ts","messages":[{"line":1,"message":"Missing semicolon","severity":2}],"output":"const x = 1;\\nconst y = 2;\\n"}]',
        stderr: '',
      });

      const filePath = 'test.ts';
      const content = 'const x=1;const y=2';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;\nconst y = 2;\n',
        fixResults: [
          {
            filePath: 'test.ts',
            messages: [{ line: 1, message: 'Missing semicolon', severity: 2 }],
            output: 'const x = 1;\nconst y = 2;\n',
          },
        ],
      });
    });
  });

  describe('empty input', () => {
    it("EMPTY: {filePath: 'test.ts', content: ''} => returns empty content and empty results", async () => {
      const filePath = 'test.ts';
      const content = '';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: '',
        fixResults: [],
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: process spawn fails => returns original content and empty results', async () => {
      ChildProcessMocker.mockSpawn(ChildProcessMocker.presets.crash());

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      // Should return original content when spawn fails
      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it('ERROR: eslint crashes with exit code 2 and stderr => throws error', async () => {
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });

      // Mock ProcessUtil.spawnPromise directly to ensure the result is returned
      jest.spyOn(ProcessUtil, 'spawnPromise').mockResolvedValue({
        code: 2,
        stdout: '',
        stderr: 'The --fix option and the --fix-dry-run option cannot be used together.',
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await expect(lintContent({ filePath, content })).rejects.toThrow(
        'ESLint crashed during linting',
      );

      expect(mockStderrWrite).toHaveBeenCalledWith('Lint crashed during linting:\n');
      expect(mockStderrWrite).toHaveBeenCalledWith(
        'The --fix option and the --fix-dry-run option cannot be used together.\n',
      );
    });

    it("ERROR: typescript project error with 'parserOptions.project' => returns original content", async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout:
            '[{"messages":[{"line":1,"message":"Parsing error: \\\'parserOptions.project\\\' has been set","severity":2}]}]',
          stderr: '',
        },
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it('ERROR: spawn promise catch returns error object => handles error properly', async () => {
      ChildProcessMocker.mockSpawn(
        ChildProcessMocker.presets.crash(new Error('Custom spawn error')),
      );

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it('ERROR: process spawn returns non-zero exit code => still processes output', async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 1,
          stdout: '[{"messages":[{"line":1,"message":"Parsing error","severity":2}]}]',
          stderr: '',
        },
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      // Non-zero exit codes still process output, but parsing may fail
      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });
  });

  describe('edge cases', () => {
    it("EDGE: file not lintable with 'No files matching' => returns original content", async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout: '',
          stderr: 'No files matching the pattern "test.ts" were found.',
        },
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it("EDGE: file ignored with 'Ignore pattern' => returns original content", async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout: '',
          stderr: 'File ignored because of a matching ignore pattern.',
        },
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it('EDGE: process spawn timeout after 30 seconds => returns original content', async () => {
      ChildProcessMocker.mockSpawn(ChildProcessMocker.presets.timeout());

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it('EDGE: very long file path => handles correctly', async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout: '[{"messages":[]}]',
          stderr: '',
        },
      });

      const filePath = '/very/long/path/to/nested/directories/that/might/cause/issues/test.ts';
      const content = 'const x = 1;';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent: 'const x = 1;',
        fixResults: [],
      });
    });

    it('EDGE: content with special characters => processes correctly', async () => {
      ChildProcessMocker.mockSpawn({
        result: {
          code: 0,
          stdout: '[{"messages":[]}]',
          stderr: '',
        },
      });

      const filePath = 'test.ts';
      const content =
        'const emoji = "🚀💻"; const unicode = "こんにちは"; const quotes = \'"nested"\';';

      const result = await lintContent({ filePath, content });

      expect(result).toStrictEqual({
        fixedContent:
          'const emoji = "🚀💻"; const unicode = "こんにちは"; const quotes = \'"nested"\';',
        fixResults: [],
      });
    });
  });
});
