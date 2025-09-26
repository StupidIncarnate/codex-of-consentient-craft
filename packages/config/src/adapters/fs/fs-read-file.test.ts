import { readFile } from 'fs/promises';
import { fsReadFile } from './fs-read-file';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

type NodeError = Error & {
  code: string;
};

describe('fsReadFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful operations', () => {
    it("VALID: {filePath: '/path/to/file.txt'} => returns file content", async () => {
      const expectedContent = 'file content here';
      mockReadFile.mockResolvedValue(expectedContent);

      const result = await fsReadFile({ filePath: '/path/to/file.txt' });

      expect(result).toBe(expectedContent);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf8');
    });

    it("VALID: {filePath: 'relative/path/config.json'} => returns JSON content", async () => {
      const jsonContent = '{"key": "value", "number": 42}';
      mockReadFile.mockResolvedValue(jsonContent);

      const result = await fsReadFile({ filePath: 'relative/path/config.json' });

      expect(result).toBe(jsonContent);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('relative/path/config.json', 'utf8');
    });

    it("VALID: {filePath: '/absolute/path/empty.txt'} => returns empty string", async () => {
      mockReadFile.mockResolvedValue('');

      const result = await fsReadFile({ filePath: '/absolute/path/empty.txt' });

      expect(result).toBe('');
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/absolute/path/empty.txt', 'utf8');
    });
  });

  describe('error conditions', () => {
    it("ERROR: {filePath: '/non/existent/file.txt'} => throws ENOENT error", async () => {
      const fileNotFoundError: NodeError = Object.assign(
        new Error('ENOENT: no such file or directory'),
        { code: 'ENOENT' },
      );
      mockReadFile.mockRejectedValue(fileNotFoundError);

      await expect(fsReadFile({ filePath: '/non/existent/file.txt' })).rejects.toThrow(
        'ENOENT: no such file or directory',
      );

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/non/existent/file.txt', 'utf8');
    });

    it("ERROR: {filePath: '/restricted/file.txt'} => throws EACCES error", async () => {
      const permissionError: NodeError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });
      mockReadFile.mockRejectedValue(permissionError);

      await expect(fsReadFile({ filePath: '/restricted/file.txt' })).rejects.toThrow(
        'EACCES: permission denied',
      );

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/restricted/file.txt', 'utf8');
    });

    it("ERROR: {filePath: '/path/to/directory'} => throws EISDIR error", async () => {
      const isDirError: NodeError = Object.assign(
        new Error('EISDIR: illegal operation on a directory'),
        { code: 'EISDIR' },
      );
      mockReadFile.mockRejectedValue(isDirError);

      await expect(fsReadFile({ filePath: '/path/to/directory' })).rejects.toThrow(
        'EISDIR: illegal operation on a directory',
      );

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/path/to/directory', 'utf8');
    });
  });

  describe('edge cases', () => {
    it("EDGE: {filePath: '.'} => throws or returns directory content error", async () => {
      const currentDirError: NodeError = Object.assign(
        new Error('EISDIR: illegal operation on a directory'),
        { code: 'EISDIR' },
      );
      mockReadFile.mockRejectedValue(currentDirError);

      await expect(fsReadFile({ filePath: '.' })).rejects.toThrow(
        'EISDIR: illegal operation on a directory',
      );

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('.', 'utf8');
    });

    it("EDGE: {filePath: ''} => passes empty string to readFile", async () => {
      const emptyPathError: NodeError = Object.assign(
        new Error('ENOENT: no such file or directory'),
        { code: 'ENOENT' },
      );
      mockReadFile.mockRejectedValue(emptyPathError);

      await expect(fsReadFile({ filePath: '' })).rejects.toThrow(
        'ENOENT: no such file or directory',
      );

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('', 'utf8');
    });

    it("EDGE: {filePath: '/path/with/unicode/файл.txt'} => returns unicode content", async () => {
      const unicodeContent = '🚀 Unicode content with специальные символы';
      mockReadFile.mockResolvedValue(unicodeContent);

      const result = await fsReadFile({ filePath: '/path/with/unicode/файл.txt' });

      expect(result).toBe(unicodeContent);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith('/path/with/unicode/файл.txt', 'utf8');
    });
  });
});
