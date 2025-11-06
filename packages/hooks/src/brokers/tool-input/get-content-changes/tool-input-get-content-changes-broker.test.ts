import { toolInputGetContentChangesBroker } from './tool-input-get-content-changes-broker';
import { editToolInputContract } from '../../../contracts/edit-tool-input/edit-tool-input-contract';
import { multiEditToolInputContract } from '../../../contracts/multi-edit-tool-input/multi-edit-tool-input-contract';
import type { MultiEditToolInput } from '../../../contracts/multi-edit-tool-input/multi-edit-tool-input-contract';
import { writeToolInputContract } from '../../../contracts/write-tool-input/write-tool-input-contract';
import type { WriteToolInput } from '../../../contracts/write-tool-input/write-tool-input-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';

// Mock fs modules
jest.mock('../../../adapters/fs/read-file/fs-read-file-adapter');

const mockReadFile = jest.mocked(fsReadFileAdapter);

describe('toolInputGetContentChangesBroker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('VALID: WriteToolInput with existing file => returns old and new content', async () => {
    const toolInput: WriteToolInput = writeToolInputContract.parse({
      file_path: '/test/file.txt',
      content: 'New content',
    });

    mockReadFile.mockResolvedValue(fileContentsContract.parse('Old content'));

    const result = await toolInputGetContentChangesBroker({ toolInput });

    expect(result).toStrictEqual([
      {
        oldContent: 'Old content',
        newContent: 'New content',
      },
    ]);
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it('VALID: WriteToolInput with new file (ENOENT) => returns empty old content and new content', async () => {
    const toolInput: WriteToolInput = writeToolInputContract.parse({
      file_path: '/test/newfile.txt',
      content: 'New file content',
    });

    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    const result = await toolInputGetContentChangesBroker({ toolInput });

    expect(result).toStrictEqual([
      {
        oldContent: '',
        newContent: 'New file content',
      },
    ]);
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/newfile.txt'),
    });
  });

  it('VALID: EditToolInput simple text replacement => returns full file content with changes applied', async () => {
    const toolInput = editToolInputContract.parse({
      file_path: '/test/file.txt',
      old_string: 'Hello',
      new_string: 'Hi',
    });

    const existingContent = 'Hello world!';
    mockReadFile.mockResolvedValue(fileContentsContract.parse(existingContent));

    const result = await toolInputGetContentChangesBroker({ toolInput });

    expect(result).toStrictEqual([
      {
        oldContent: 'Hello world!',
        newContent: 'Hi world!',
      },
    ]);
    expect(mockReadFile).toHaveBeenCalledTimes(2); // Once for oldContent, once for toolInputGetFullContentBroker
  });

  it('BUG: EditToolInput with full file context => should return full file content before and after edit for proper linting', async () => {
    const toolInput = editToolInputContract.parse({
      file_path: '/test/example.ts',
      old_string: 'function test(param: string): void {',
      new_string: 'function test(param: any): void {',
    });

    const existingFileContent = `function test(param: string): void {
  console.log(param);
}`;

    mockReadFile.mockResolvedValue(fileContentsContract.parse(existingFileContent));

    const result = await toolInputGetContentChangesBroker({ toolInput });

    // Currently this test FAILS because Edit tool only returns fragments
    // This makes ESLint unable to properly analyze TypeScript violations
    // The bug is that we get fragments instead of full file context:
    //   OldContent: 'function test(param: string): void {'
    //   NewContent: 'function test(param: any): void {'
    // Instead of:
    //   OldContent: 'function test(param: string): void {\n  console.log(param);\n}'
    //   NewContent: 'function test(param: any): void {\n  console.log(param);\n}'

    expect(result).toStrictEqual([
      {
        oldContent: existingFileContent,
        newContent: `function test(param: any): void {
  console.log(param);
}`,
      },
    ]);
    expect(mockReadFile).toHaveBeenCalledTimes(2); // Should read file twice like MultiEdit does
  });

  it('VALID: MultiEditToolInput with existing file => returns full file before and after changes', async () => {
    const toolInput: MultiEditToolInput = multiEditToolInputContract.parse({
      file_path: '/test/file.txt',
      edits: [
        { old_string: 'Hello', new_string: 'Hi' },
        { old_string: 'world', new_string: 'universe' },
      ],
    });

    mockReadFile.mockResolvedValue(fileContentsContract.parse('Hello world'));

    const result = await toolInputGetContentChangesBroker({ toolInput });

    expect(result).toStrictEqual([
      {
        oldContent: 'Hello world',
        newContent: 'Hi universe',
      },
    ]);
    expect(mockReadFile).toHaveBeenCalledTimes(2);
  });

  it('VALID: MultiEditToolInput with new file (ENOENT) => returns empty array', async () => {
    const toolInput: MultiEditToolInput = multiEditToolInputContract.parse({
      file_path: '/test/newfile.txt',
      edits: [{ old_string: 'placeholder', new_string: 'content' }],
    });

    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error);

    const result = await toolInputGetContentChangesBroker({ toolInput });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: WriteToolInput file read error (not ENOENT) => throws error', async () => {
    const toolInput: WriteToolInput = writeToolInputContract.parse({
      file_path: '/test/file.txt',
      content: 'New content',
    });

    const error = new Error('Permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockReadFile.mockRejectedValue(error);

    await expect(toolInputGetContentChangesBroker({ toolInput })).rejects.toThrow(
      'Permission denied',
    );
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });

  it('ERROR: MultiEditToolInput file read error (not ENOENT) => throws error', async () => {
    const toolInput: MultiEditToolInput = multiEditToolInputContract.parse({
      file_path: '/test/file.txt',
      edits: [{ old_string: 'Hello', new_string: 'Hi' }],
    });

    const error = new Error('Permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    mockReadFile.mockRejectedValue(error);

    await expect(toolInputGetContentChangesBroker({ toolInput })).rejects.toThrow(
      'Permission denied',
    );
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith({
      filePath: filePathContract.parse('/test/file.txt'),
    });
  });
});
