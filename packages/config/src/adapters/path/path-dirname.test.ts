import { dirname } from 'path';
import { pathDirname } from './path-dirname';

jest.mock('path', () => {
  return {
    dirname: jest.fn(),
  };
});

const mockDirname = jest.mocked(dirname);

describe('pathDirname', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful operations', () => {
    it('VALID: {path: "/path/to/file.txt"} => returns "/path/to"', () => {
      const path = '/path/to/file.txt';
      const expectedResult = '/path/to';

      mockDirname.mockReturnValueOnce(expectedResult);

      const result = pathDirname({ path });

      expect(result).toBe(expectedResult);
      expect(mockDirname).toHaveBeenCalledTimes(1);
      expect(mockDirname).toHaveBeenCalledWith(path);
    });

    it('VALID: {path: "relative/file.js"} => returns "relative"', () => {
      const path = 'relative/file.js';
      const expectedResult = 'relative';

      mockDirname.mockReturnValueOnce(expectedResult);

      const result = pathDirname({ path });

      expect(result).toBe(expectedResult);
      expect(mockDirname).toHaveBeenCalledWith(path);
    });

    it('VALID: {path: "/root/single/file"} => returns "/root/single"', () => {
      const path = '/root/single/file';
      const expectedResult = '/root/single';

      mockDirname.mockReturnValueOnce(expectedResult);

      const result = pathDirname({ path });

      expect(result).toBe(expectedResult);
      expect(mockDirname).toHaveBeenCalledWith(path);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {path: "/"} => returns "/"', () => {
      const path = '/';
      const expectedResult = '/';

      mockDirname.mockReturnValueOnce(expectedResult);

      const result = pathDirname({ path });

      expect(result).toBe(expectedResult);
      expect(mockDirname).toHaveBeenCalledWith(path);
    });

    it('EDGE: {path: "file.txt"} => returns "."', () => {
      const path = 'file.txt';
      const expectedResult = '.';

      mockDirname.mockReturnValueOnce(expectedResult);

      const result = pathDirname({ path });

      expect(result).toBe(expectedResult);
      expect(mockDirname).toHaveBeenCalledWith(path);
    });

    it('EDGE: {path: ""} => returns "."', () => {
      const path = '';
      const expectedResult = '.';

      mockDirname.mockReturnValueOnce(expectedResult);

      const result = pathDirname({ path });

      expect(result).toBe(expectedResult);
      expect(mockDirname).toHaveBeenCalledWith(path);
    });
  });
});
