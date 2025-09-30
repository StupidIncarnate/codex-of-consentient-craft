import { resolve } from 'path';
import { pathResolve } from './path-resolve-single';

jest.mock('path', () => {
  return {
    resolve: jest.fn(),
  };
});

const mockResolve = resolve as jest.MockedFunction<typeof resolve>;

describe('pathResolve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful operations', () => {
    it('VALID: {path: "relative/path"} => returns absolute path', () => {
      const path = 'relative/path';
      const expectedResult = '/current/directory/relative/path';

      mockResolve.mockReturnValueOnce(expectedResult);

      const result = pathResolve({ path });

      expect(result).toBe(expectedResult);
      expect(mockResolve).toHaveBeenCalledTimes(1);
      expect(mockResolve).toHaveBeenCalledWith(path);
    });

    it('VALID: {path: "/absolute/path"} => returns normalized absolute path', () => {
      const path = '/absolute/path';
      const expectedResult = '/absolute/path';

      mockResolve.mockReturnValueOnce(expectedResult);

      const result = pathResolve({ path });

      expect(result).toBe(expectedResult);
      expect(mockResolve).toHaveBeenCalledWith(path);
    });

    it('VALID: {path: "../parent"} => returns resolved parent path', () => {
      const path = '../parent';
      const expectedResult = '/current/parent';

      mockResolve.mockReturnValueOnce(expectedResult);

      const result = pathResolve({ path });

      expect(result).toBe(expectedResult);
      expect(mockResolve).toHaveBeenCalledWith(path);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {path: "."} => returns current directory path', () => {
      const path = '.';
      const expectedResult = '/current/directory';

      mockResolve.mockReturnValueOnce(expectedResult);

      const result = pathResolve({ path });

      expect(result).toBe(expectedResult);
      expect(mockResolve).toHaveBeenCalledWith(path);
    });

    it('EDGE: {path: ""} => returns current directory path', () => {
      const path = '';
      const expectedResult = '/current/directory';

      mockResolve.mockReturnValueOnce(expectedResult);

      const result = pathResolve({ path });

      expect(result).toBe(expectedResult);
      expect(mockResolve).toHaveBeenCalledWith(path);
    });

    it('EDGE: {path: "~/home/file.txt"} => returns resolved tilde path', () => {
      const path = '~/home/file.txt';
      const expectedResult = '/Users/username/home/file.txt';

      mockResolve.mockReturnValueOnce(expectedResult);

      const result = pathResolve({ path });

      expect(result).toBe(expectedResult);
      expect(mockResolve).toHaveBeenCalledWith(path);
    });
  });
});
