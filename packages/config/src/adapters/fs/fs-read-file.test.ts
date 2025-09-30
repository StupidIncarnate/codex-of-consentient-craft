import { readFile } from 'fs/promises';
import { fsReadFile } from './fs-read-file';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

jest.mock('fs/promises');

const mockReadFile = jest.mocked(readFile);

type NodeError = Error & {
  code: string;
};

describe('fsReadFile', () => {
  describe('successful operations', () => {
    it("VALID: {filePath: '/path/to/file.txt'} => returns file content", async () => {
      const filePath = FilePathStub('/path/to/file.txt');
      const expectedContent = 'file content here';
      mockReadFile.mockResolvedValue(expectedContent);

      const result = await fsReadFile({ filePath });

      expect(result).toBe(FileContentsStub(expectedContent));
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });

    it("VALID: {filePath: 'relative/path/config.json'} => returns JSON content", async () => {
      const filePath = FilePathStub('relative/path/config.json');
      const jsonContent = '{"key": "value", "number": 42}';
      mockReadFile.mockResolvedValue(jsonContent);

      const result = await fsReadFile({ filePath });

      expect(result).toBe(FileContentsStub(jsonContent));
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });

    it("VALID: {filePath: '/absolute/path/empty.txt'} => returns empty string", async () => {
      const filePath = FilePathStub('/absolute/path/empty.txt');
      mockReadFile.mockResolvedValue('');

      const result = await fsReadFile({ filePath });

      expect(result).toBe(FileContentsStub(''));
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });
  });

  describe('error conditions', () => {
    it("ERROR: {filePath: '/non/existent/file.txt'} => throws wrapped error with context", async () => {
      const filePath = FilePathStub('/non/existent/file.txt');
      const fileNotFoundError: NodeError = Object.assign(
        new Error('ENOENT: no such file or directory'),
        { code: 'ENOENT' },
      );
      mockReadFile.mockRejectedValue(fileNotFoundError);

      await expect(fsReadFile({ filePath })).rejects.toThrow(`Failed to read file at ${filePath}`);

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });

    it("ERROR: {filePath: '/restricted/file.txt'} => throws wrapped error with context", async () => {
      const filePath = FilePathStub('/restricted/file.txt');
      const permissionError: NodeError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });
      mockReadFile.mockRejectedValue(permissionError);

      await expect(fsReadFile({ filePath })).rejects.toThrow(`Failed to read file at ${filePath}`);

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });

    it("ERROR: {filePath: '/path/to/directory'} => throws wrapped error with context", async () => {
      const filePath = FilePathStub('/path/to/directory');
      const isDirError: NodeError = Object.assign(
        new Error('EISDIR: illegal operation on a directory'),
        { code: 'EISDIR' },
      );
      mockReadFile.mockRejectedValue(isDirError);

      await expect(fsReadFile({ filePath })).rejects.toThrow(`Failed to read file at ${filePath}`);

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });
  });

  describe('edge cases', () => {
    it("EDGE: {filePath: '.'} => throws wrapped error with context", async () => {
      const filePath = FilePathStub('.');
      const currentDirError: NodeError = Object.assign(
        new Error('EISDIR: illegal operation on a directory'),
        { code: 'EISDIR' },
      );
      mockReadFile.mockRejectedValue(currentDirError);

      await expect(fsReadFile({ filePath })).rejects.toThrow(`Failed to read file at ${filePath}`);

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });

    it("EDGE: {filePath: '/path/with/unicode/файл.txt'} => returns unicode content", async () => {
      const filePath = FilePathStub('/path/with/unicode/файл.txt');
      const unicodeContent = '🚀 Unicode content with специальные символы';
      mockReadFile.mockResolvedValue(unicodeContent);

      const result = await fsReadFile({ filePath });

      expect(result).toBe(FileContentsStub(unicodeContent));
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf8');
    });
  });
});
