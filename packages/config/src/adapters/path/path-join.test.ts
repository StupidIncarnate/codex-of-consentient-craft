import { join } from 'path';
import { pathJoin } from './path-join';

jest.mock('path', () => {
  return {
    join: jest.fn(),
  };
});

const mockJoin = jest.mocked(join);

describe('pathJoin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful operations', () => {
    it('VALID: {paths: ["path", "to", "file.txt"]} => returns joined path', () => {
      const paths = ['path', 'to', 'file.txt'];
      const expectedResult = 'path/to/file.txt';

      mockJoin.mockReturnValueOnce(expectedResult);

      const result = pathJoin({ paths });

      expect(result).toBe(expectedResult);
      expect(mockJoin).toHaveBeenCalledTimes(1);
      expect(mockJoin).toHaveBeenCalledWith(...paths);
    });

    it('VALID: {paths: ["/absolute", "relative"]} => returns joined absolute path', () => {
      const paths = ['/absolute', 'relative'];
      const expectedResult = '/absolute/relative';

      mockJoin.mockReturnValueOnce(expectedResult);

      const result = pathJoin({ paths });

      expect(result).toBe(expectedResult);
      expect(mockJoin).toHaveBeenCalledWith(...paths);
    });

    it('VALID: {paths: ["..", "parent", "file"]} => returns joined path with parent navigation', () => {
      const paths = ['..', 'parent', 'file'];
      const expectedResult = '../parent/file';

      mockJoin.mockReturnValueOnce(expectedResult);

      const result = pathJoin({ paths });

      expect(result).toBe(expectedResult);
      expect(mockJoin).toHaveBeenCalledWith(...paths);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {paths: []} => returns empty or current directory path', () => {
      const paths: string[] = [];
      const expectedResult = '.';

      mockJoin.mockReturnValueOnce(expectedResult);

      const result = pathJoin({ paths });

      expect(result).toBe(expectedResult);
      expect(mockJoin).toHaveBeenCalledWith();
    });

    it('EDGE: {paths: ["single"]} => returns single path element', () => {
      const paths = ['single'];
      const expectedResult = 'single';

      mockJoin.mockReturnValueOnce(expectedResult);

      const result = pathJoin({ paths });

      expect(result).toBe(expectedResult);
      expect(mockJoin).toHaveBeenCalledWith('single');
    });

    it('EDGE: {paths: ["", "empty", "", "segments"]} => returns path with empty segments', () => {
      const paths = ['', 'empty', '', 'segments'];
      const expectedResult = 'empty/segments';

      mockJoin.mockReturnValueOnce(expectedResult);

      const result = pathJoin({ paths });

      expect(result).toBe(expectedResult);
      expect(mockJoin).toHaveBeenCalledWith('', 'empty', '', 'segments');
    });

    it('EDGE: {paths: [".", "..", "complex/navigation"]} => returns normalized path', () => {
      const paths = ['.', '..', 'complex/navigation'];
      const expectedResult = '../complex/navigation';

      mockJoin.mockReturnValueOnce(expectedResult);

      const result = pathJoin({ paths });

      expect(result).toBe(expectedResult);
      expect(mockJoin).toHaveBeenCalledWith('.', '..', 'complex/navigation');
    });
  });
});
