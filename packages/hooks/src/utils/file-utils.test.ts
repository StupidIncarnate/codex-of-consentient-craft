import { FileUtils } from './file-utils';
import type { WriteToolInput, EditToolInput, MultiEditToolInput } from '../types';
import { readFile } from 'fs/promises';

// Mock fs modules
jest.mock('fs/promises');

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('FileUtils', () => {
  describe('escapeRegex()', () => {
    it("VALID: {str: 'hello'} => returns 'hello'", () => {
      expect(FileUtils.escapeRegex({ str: 'hello' })).toBe('hello');
    });

    it("VALID: {str: 'hello.world'} => returns 'hello\\.world'", () => {
      expect(FileUtils.escapeRegex({ str: 'hello.world' })).toBe('hello\\.world');
    });

    it("VALID: {str: '[test]*+?^${}()|\\\\test'} => returns escaped string", () => {
      expect(FileUtils.escapeRegex({ str: '[test]*+?^${}()|\\test' })).toBe(
        '\\[test\\]\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\\\test',
      );
    });

    it("EMPTY: {str: ''} => returns ''", () => {
      expect(FileUtils.escapeRegex({ str: '' })).toBe('');
    });
  });

  describe('getFileExtension()', () => {
    it("VALID: {filePath: 'file.txt'} => returns '.txt'", () => {
      expect(FileUtils.getFileExtension({ filePath: 'file.txt' })).toBe('.txt');
    });

    it("VALID: {filePath: 'path/file.js'} => returns '.js'", () => {
      expect(FileUtils.getFileExtension({ filePath: 'path/file.js' })).toBe('.js');
    });

    it("VALID: {filePath: 'file.test.ts'} => returns '.ts'", () => {
      expect(FileUtils.getFileExtension({ filePath: 'file.test.ts' })).toBe('.ts');
    });

    it("EDGE: {filePath: 'file'} => returns ''", () => {
      expect(FileUtils.getFileExtension({ filePath: 'file' })).toBe('');
    });

    it("EDGE: {filePath: 'file.'} => returns '.'", () => {
      expect(FileUtils.getFileExtension({ filePath: 'file.' })).toBe('.');
    });

    it("EDGE: {filePath: '.gitignore'} => returns '.gitignore'", () => {
      expect(FileUtils.getFileExtension({ filePath: '.gitignore' })).toBe('.gitignore');
    });
  });

  describe('getFullFileContent()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('VALID: WriteToolInput with content => returns content', async () => {
      const toolInput: WriteToolInput = {
        file_path: '/test/file.txt',
        content: 'Hello world',
      };

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBe('Hello world');
    });

    it('VALID: EditToolInput single edit => returns modified content', async () => {
      const toolInput: EditToolInput = {
        file_path: '/test/file.txt',
        old_string: 'Hello',
        new_string: 'Hi',
      };

      mockReadFile.mockResolvedValue('Hello world');

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBe('Hi world');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('VALID: EditToolInput with replace_all => returns content with all replacements', async () => {
      const toolInput: EditToolInput = {
        file_path: '/test/file.txt',
        old_string: 'test',
        new_string: 'demo',
        replace_all: true,
      };

      mockReadFile.mockResolvedValue('test file with test content and test data');

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBe('demo file with demo content and demo data');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('EDGE: toolInput without file_path => returns null', async () => {
      const toolInput = {
        content: 'Hello world',
      } as WriteToolInput;

      const result = await FileUtils.getFullFileContent({
        toolInput: { ...toolInput, file_path: '' },
      });

      expect(result).toBeNull();
    });

    it("ERROR: file doesn't exist for Edit tool => returns null", async () => {
      const toolInput: EditToolInput = {
        file_path: '/test/nonexistent.txt',
        old_string: 'Hello',
        new_string: 'Hi',
      };

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBeNull();
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/nonexistent.txt', 'utf-8');
    });

    it('ERROR: file read error (not ENOENT) => throws error', async () => {
      const toolInput: EditToolInput = {
        file_path: '/test/file.txt',
        old_string: 'Hello',
        new_string: 'Hi',
      };

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockReadFile.mockRejectedValue(error);

      await expect(FileUtils.getFullFileContent({ toolInput })).rejects.toThrow(
        'Permission denied',
      );
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('VALID: MultiEditToolInput single edit => returns content with edit applied', async () => {
      const toolInput: MultiEditToolInput = {
        file_path: '/test/file.txt',
        edits: [{ old_string: 'Hello', new_string: 'Hi' }],
      };

      mockReadFile.mockResolvedValue('Hello world');

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBe('Hi world');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('VALID: MultiEditToolInput multiple edits => returns content with all edits applied', async () => {
      const toolInput: MultiEditToolInput = {
        file_path: '/test/file.txt',
        edits: [
          { old_string: 'Hello', new_string: 'Hi' },
          { old_string: 'world', new_string: 'universe' },
        ],
      };

      mockReadFile.mockResolvedValue('Hello world');

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBe('Hi universe');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('VALID: MultiEditToolInput with replace_all edits => returns content with all replacements', async () => {
      const toolInput: MultiEditToolInput = {
        file_path: '/test/file.txt',
        edits: [
          { old_string: 'test', new_string: 'demo', replace_all: true },
          { old_string: 'file', new_string: 'document' },
        ],
      };

      mockReadFile.mockResolvedValue('test file with test content in test file');

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBe('demo document with demo content in demo file');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it("ERROR: file doesn't exist for MultiEdit tool => returns null", async () => {
      const toolInput: MultiEditToolInput = {
        file_path: '/test/nonexistent.txt',
        edits: [{ old_string: 'Hello', new_string: 'Hi' }],
      };

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBeNull();
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/nonexistent.txt', 'utf-8');
    });

    it("EDGE: file doesn't exist for Write tool => returns content", async () => {
      const toolInput: WriteToolInput = {
        file_path: '/test/newfile.txt',
        content: 'New file content',
      };

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const result = await FileUtils.getFullFileContent({ toolInput });

      expect(result).toBe('New file content');
    });
  });

  describe('getContentChanges()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('VALID: WriteToolInput with existing file => returns old and new content', async () => {
      const toolInput: WriteToolInput = {
        file_path: '/test/file.txt',
        content: 'New content',
      };

      mockReadFile.mockResolvedValue('Old content');

      const result = await FileUtils.getContentChanges({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Old content',
          newContent: 'New content',
        },
      ]);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('VALID: WriteToolInput with new file (ENOENT) => returns empty old content and new content', async () => {
      const toolInput: WriteToolInput = {
        file_path: '/test/newfile.txt',
        content: 'New file content',
      };

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const result = await FileUtils.getContentChanges({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: '',
          newContent: 'New file content',
        },
      ]);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/newfile.txt', 'utf-8');
    });

    it('VALID: EditToolInput => returns old_string and new_string', async () => {
      const toolInput: EditToolInput = {
        file_path: '/test/file.txt',
        old_string: 'Hello',
        new_string: 'Hi',
      };

      const result = await FileUtils.getContentChanges({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Hello',
          newContent: 'Hi',
        },
      ]);
    });

    it('VALID: MultiEditToolInput with existing file => returns full file before and after changes', async () => {
      const toolInput: MultiEditToolInput = {
        file_path: '/test/file.txt',
        edits: [
          { old_string: 'Hello', new_string: 'Hi' },
          { old_string: 'world', new_string: 'universe' },
        ],
      };

      mockReadFile.mockResolvedValue('Hello world');

      const result = await FileUtils.getContentChanges({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Hello world',
          newContent: 'Hi universe',
        },
      ]);
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });

    it('VALID: MultiEditToolInput with new file (ENOENT) => returns empty array', async () => {
      const toolInput: MultiEditToolInput = {
        file_path: '/test/newfile.txt',
        edits: [{ old_string: 'placeholder', new_string: 'content' }],
      };

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const result = await FileUtils.getContentChanges({ toolInput });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: WriteToolInput file read error (not ENOENT) => throws error', async () => {
      const toolInput: WriteToolInput = {
        file_path: '/test/file.txt',
        content: 'New content',
      };

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockReadFile.mockRejectedValue(error);

      await expect(FileUtils.getContentChanges({ toolInput })).rejects.toThrow('Permission denied');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('ERROR: MultiEditToolInput file read error (not ENOENT) => throws error', async () => {
      const toolInput: MultiEditToolInput = {
        file_path: '/test/file.txt',
        edits: [{ old_string: 'Hello', new_string: 'Hi' }],
      };

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockReadFile.mockRejectedValue(error);

      await expect(FileUtils.getContentChanges({ toolInput })).rejects.toThrow('Permission denied');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });
  });

  describe('isNewSession()', () => {
    it("VALID: file doesn't exist => returns true", async () => {
      const fs = require('fs');
      const spy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await FileUtils.isNewSession({ transcriptPath: '/test/nonexistent.txt' });

      expect(result).toBe(true);
      spy.mockRestore();
    });

    it('VALID: file exists and size < 1024 => returns true', async () => {
      const fs = require('fs');
      const fsPromises = require('fs/promises');
      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const statSpy = jest
        .spyOn(fsPromises, 'stat')
        .mockResolvedValue({ size: 500 } as import('fs').Stats);

      const result = await FileUtils.isNewSession({ transcriptPath: '/test/small.txt' });

      expect(result).toBe(true);
      existsSpy.mockRestore();
      statSpy.mockRestore();
    });

    it('VALID: file exists and size >= 1024 => returns false', async () => {
      const fs = require('fs');
      const fsPromises = require('fs/promises');
      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const statSpy = jest
        .spyOn(fsPromises, 'stat')
        .mockResolvedValue({ size: 2048 } as import('fs').Stats);

      const result = await FileUtils.isNewSession({ transcriptPath: '/test/large.txt' });

      expect(result).toBe(false);
      existsSpy.mockRestore();
      statSpy.mockRestore();
    });

    it('ERROR: file stat error => returns true', async () => {
      const fs = require('fs');
      const fsPromises = require('fs/promises');
      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const statSpy = jest
        .spyOn(fsPromises, 'stat')
        .mockRejectedValue(new Error('Permission denied'));

      const result = await FileUtils.isNewSession({ transcriptPath: '/test/error.txt' });

      expect(result).toBe(true);
      existsSpy.mockRestore();
      statSpy.mockRestore();
    });
  });

  describe('loadStandardsFiles()', () => {
    it('VALID: all standards files exist => returns concatenated content', async () => {
      const path = require('path');
      const fs = require('fs');
      const fsPromises = require('fs/promises');

      const resolveSpy = jest
        .spyOn(path, 'resolve')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-principles.md')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const readSpy = jest
        .spyOn(fsPromises, 'readFile')
        .mockResolvedValueOnce('Coding content')
        .mockResolvedValueOnce('Testing content');

      const result = await FileUtils.loadStandardsFiles({ cwd: '/test' });

      expect(result).toBe(
        '\n\n# CODING PRINCIPLES\n\nCoding content\n\n# TESTING STANDARDS\n\nTesting content',
      );

      resolveSpy.mockRestore();
      existsSpy.mockRestore();
      readSpy.mockRestore();
    });

    it('VALID: only coding-principles.md exists => returns partial content', async () => {
      const path = require('path');
      const fs = require('fs');
      const fsPromises = require('fs/promises');

      const resolveSpy = jest
        .spyOn(path, 'resolve')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-principles.md')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

      const existsSpy = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValueOnce(true) // coding-principles.md exists
        .mockReturnValueOnce(false); // testing-standards.md doesn't exist

      const readSpy = jest
        .spyOn(fsPromises, 'readFile')
        .mockResolvedValueOnce('Coding content only');

      const result = await FileUtils.loadStandardsFiles({ cwd: '/test' });

      expect(result).toBe('\n\n# CODING PRINCIPLES\n\nCoding content only');

      resolveSpy.mockRestore();
      existsSpy.mockRestore();
      readSpy.mockRestore();
    });

    it('VALID: only testing-standards.md exists => returns partial content', async () => {
      const path = require('path');
      const fs = require('fs');
      const fsPromises = require('fs/promises');

      const resolveSpy = jest
        .spyOn(path, 'resolve')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-principles.md')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

      const existsSpy = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValueOnce(false) // coding-principles.md doesn't exist
        .mockReturnValueOnce(true); // testing-standards.md exists

      const readSpy = jest
        .spyOn(fsPromises, 'readFile')
        .mockResolvedValueOnce('Testing content only');

      const result = await FileUtils.loadStandardsFiles({ cwd: '/test' });

      expect(result).toBe('\n\n# TESTING STANDARDS\n\nTesting content only');

      resolveSpy.mockRestore();
      existsSpy.mockRestore();
      readSpy.mockRestore();
    });

    it('VALID: no standards files exist => returns empty content', async () => {
      const path = require('path');
      const fs = require('fs');

      const resolveSpy = jest
        .spyOn(path, 'resolve')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-principles.md')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await FileUtils.loadStandardsFiles({ cwd: '/test' });

      expect(result).toBe('');

      resolveSpy.mockRestore();
      existsSpy.mockRestore();
    });

    it('ERROR: file read error => logs error and continues with other files', async () => {
      const path = require('path');
      const fs = require('fs');
      const fsPromises = require('fs/promises');

      const resolveSpy = jest
        .spyOn(path, 'resolve')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/coding-principles.md')
        .mockReturnValueOnce('/test/node_modules/@questmaestro/standards/testing-standards.md');

      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const readSpy = jest
        .spyOn(fsPromises, 'readFile')
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce('Testing content');

      const result = await FileUtils.loadStandardsFiles({ cwd: '/test' });

      expect(result).toBe('\n\n# TESTING STANDARDS\n\nTesting content');

      resolveSpy.mockRestore();
      existsSpy.mockRestore();
      readSpy.mockRestore();
    });
  });
});
