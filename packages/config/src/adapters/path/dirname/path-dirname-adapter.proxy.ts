import { dirname } from 'path';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

// Declare jest.mock() in proxy (auto-hoisted by Jest)
jest.mock('path', () => ({
  dirname: jest.fn(),
}));

export const pathDirnameAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = jest.mocked(dirname);

  // Default mock behavior - return same path as directory
  mock.mockImplementation((inputPath: string) => inputPath);

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }) => {
      mock.mockReturnValueOnce(result);
    },
  };
};
