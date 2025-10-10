// Example 1: File System (fs) Mocking
// This demonstrates the traditional pattern for mocking Node.js built-in modules

import { fsReadFileAdapter } from './fs-read-file-adapter';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

// Mock the Node.js fs/promises module
// jest.mock() is automatically hoisted by Jest - it runs BEFORE the imports above
jest.mock('fs/promises');
import { readFile } from 'fs/promises';
const mockReadFile = jest.mocked(readFile);

describe('fsReadFileAdapter', () => {
  // No beforeEach needed - @questmaestro/testing auto-resets all mocks globally

  it('VALID: {filePath: "/config.json"} => returns file contents', async () => {
    // Arrange: Setup test data using branded type stubs
    const filePath = FilePathStub('/config.json');
    const expectedContents = FileContentsStub('{"key": "value"}');

    // Setup mock to return Buffer (what fs.readFile actually returns)
    mockReadFile.mockResolvedValue(Buffer.from('{"key": "value"}'));

    // Act: Call the function under test
    const result = await fsReadFileAdapter({ filePath });

    // Assert: Verify complete result AND all mock calls
    expect(result).toStrictEqual(expectedContents);
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
  });

  it('ERROR: {filePath: "/missing.json"} => throws file not found error', async () => {
    // Arrange
    const filePath = FilePathStub('/missing.json');

    // Mock rejected promise for error case
    mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

    // Act & Assert: Test async error
    await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
      'ENOENT: no such file or directory',
    );
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
  });

  it('EMPTY: {filePath: "/empty.txt"} => returns empty file contents', async () => {
    // Arrange
    const filePath = FilePathStub('/empty.txt');
    const expectedContents = FileContentsStub('');

    mockReadFile.mockResolvedValue(Buffer.from(''));

    // Act
    const result = await fsReadFileAdapter({ filePath });

    // Assert
    expect(result).toStrictEqual(expectedContents);
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
  });
});
