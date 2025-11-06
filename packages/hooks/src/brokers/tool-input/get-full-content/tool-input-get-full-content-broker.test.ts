import { toolInputGetFullContentBroker } from './tool-input-get-full-content-broker';
import { editToolInputContract } from '../../../contracts/edit-tool-input/edit-tool-input-contract';
import type { EditToolInput } from '../../../contracts/edit-tool-input/edit-tool-input-contract';
import { multiEditToolInputContract } from '../../../contracts/multi-edit-tool-input/multi-edit-tool-input-contract';
import type { MultiEditToolInput } from '../../../contracts/multi-edit-tool-input/multi-edit-tool-input-contract';
import { writeToolInputContract } from '../../../contracts/write-tool-input/write-tool-input-contract';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';

// Mock fs modules
jest.mock('../../../adapters/fs/read-file/fs-read-file-adapter');

const mockReadFile = jest.mocked(fsReadFileAdapter);

describe('toolInputGetFullContentBroker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('VALID: WriteToolInput with content => returns content', async () => {
    const toolInput = writeToolInputContract.parse({
      file_path: '/test/file.txt',
      content: 'Hello world',
    });

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBe('Hello world');
  });

  it('VALID: EditToolInput single edit => returns modified content', async () => {
    const toolInput = editToolInputContract.parse({
      file_path: '/test/file.txt',
      old_string: 'Hello',
      new_string: 'Hi',
    });

    mockReadFile.mockResolvedValue(fileContentsContract.parse('Hello world'));

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBe('Hi world');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it('VALID: EditToolInput with replace_all => returns content with all replacements', async () => {
    const toolInput = editToolInputContract.parse({
      file_path: '/test/file.txt',
      old_string: 'test',
      new_string: 'demo',
      replace_all: true,
    });

    mockReadFile.mockResolvedValue(
      fileContentsContract.parse('test file with test content and test data'),
    );

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBe('demo file with demo content and demo data');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it('EDGE: toolInput without file_path => returns null', async () => {
    const toolInput = WriteToolInputStub({
      content: 'Hello world',
      file_path: '',
    });

    const result = await toolInputGetFullContentBroker({
      toolInput,
    });

    expect(result).toBeNull();
  });

  it("ERROR: file doesn't exist for Edit tool => returns null", async () => {
    const toolInput = editToolInputContract.parse({
      file_path: '/test/nonexistent.txt',
      old_string: 'Hello',
      new_string: 'Hi',
    });

    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBeNull();
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/nonexistent.txt'),
    });
  });

  it('ERROR: file read error (not ENOENT) => throws error', async () => {
    const toolInput: EditToolInput = editToolInputContract.parse({
      file_path: '/test/file.txt',
      old_string: 'Hello',
      new_string: 'Hi',
    });

    const error = new Error('Permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockReadFile.mockRejectedValue(error);

    await expect(toolInputGetFullContentBroker({ toolInput })).rejects.toThrow('Permission denied');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it('VALID: MultiEditToolInput single edit => returns content with edit applied', async () => {
    const toolInput: MultiEditToolInput = multiEditToolInputContract.parse({
      file_path: '/test/file.txt',
      edits: [{ old_string: 'Hello', new_string: 'Hi' }],
    });

    mockReadFile.mockResolvedValue(fileContentsContract.parse('Hello world'));

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBe('Hi world');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it('VALID: MultiEditToolInput multiple edits => returns content with all edits applied', async () => {
    const toolInput: MultiEditToolInput = multiEditToolInputContract.parse({
      file_path: '/test/file.txt',
      edits: [
        { old_string: 'Hello', new_string: 'Hi' },
        { old_string: 'world', new_string: 'universe' },
      ],
    });

    mockReadFile.mockResolvedValue(fileContentsContract.parse('Hello world'));

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBe('Hi universe');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it('VALID: MultiEditToolInput with replace_all edits => returns content with all replacements', async () => {
    const toolInput: MultiEditToolInput = multiEditToolInputContract.parse({
      file_path: '/test/file.txt',
      edits: [
        { old_string: 'test', new_string: 'demo', replace_all: true },
        { old_string: 'file', new_string: 'document' },
      ],
    });

    mockReadFile.mockResolvedValue(
      fileContentsContract.parse('test file with test content in test file'),
    );

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBe('demo document with demo content in demo file');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it("ERROR: file doesn't exist for MultiEdit tool => returns null", async () => {
    const toolInput: MultiEditToolInput = multiEditToolInputContract.parse({
      file_path: '/test/nonexistent.txt',
      edits: [{ old_string: 'Hello', new_string: 'Hi' }],
    });

    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBeNull();
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/nonexistent.txt'),
    });
  });

  it("EDGE: file doesn't exist for Write tool => returns content", async () => {
    const toolInput = writeToolInputContract.parse({
      file_path: '/test/newfile.txt',
      content: 'New file content',
    });

    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    const result = await toolInputGetFullContentBroker({ toolInput });

    expect(result).toBe('New file content');
  });
});
