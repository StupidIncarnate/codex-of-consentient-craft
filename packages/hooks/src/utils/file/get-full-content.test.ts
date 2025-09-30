import { fileUtilGetFullFileContent } from './get-full-content';
import type { EditToolInput, MultiEditToolInput, WriteToolInput } from '../../types/tool-type';
import { readFile } from 'fs/promises';

// Mock fs modules
jest.mock('fs/promises');

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('fileUtilGetFullFileContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('VALID: WriteToolInput with content => returns content', async () => {
    const toolInput: WriteToolInput = {
      file_path: '/test/file.txt',
      content: 'Hello world',
    };

    const result = await fileUtilGetFullFileContent({ toolInput });

    expect(result).toBe('Hello world');
  });

  it('VALID: EditToolInput single edit => returns modified content', async () => {
    const toolInput: EditToolInput = {
      file_path: '/test/file.txt',
      old_string: 'Hello',
      new_string: 'Hi',
    };

    mockReadFile.mockResolvedValue('Hello world');

    const result = await fileUtilGetFullFileContent({ toolInput });

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

    const result = await fileUtilGetFullFileContent({ toolInput });

    expect(result).toBe('demo file with demo content and demo data');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
  });

  it('EDGE: toolInput without file_path => returns null', async () => {
    const toolInput = {
      content: 'Hello world',
    } as WriteToolInput;

    const result = await fileUtilGetFullFileContent({
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

    const result = await fileUtilGetFullFileContent({ toolInput });

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

    await expect(fileUtilGetFullFileContent({ toolInput })).rejects.toThrow('Permission denied');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
  });

  it('VALID: MultiEditToolInput single edit => returns content with edit applied', async () => {
    const toolInput: MultiEditToolInput = {
      file_path: '/test/file.txt',
      edits: [{ old_string: 'Hello', new_string: 'Hi' }],
    };

    mockReadFile.mockResolvedValue('Hello world');

    const result = await fileUtilGetFullFileContent({ toolInput });

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

    const result = await fileUtilGetFullFileContent({ toolInput });

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

    const result = await fileUtilGetFullFileContent({ toolInput });

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

    const result = await fileUtilGetFullFileContent({ toolInput });

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

    const result = await fileUtilGetFullFileContent({ toolInput });

    expect(result).toBe('New file content');
  });
});
