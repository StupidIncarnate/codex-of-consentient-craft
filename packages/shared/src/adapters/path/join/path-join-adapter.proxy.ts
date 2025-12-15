import { join } from 'path';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

// Declare jest.mock() in proxy (auto-hoisted by Jest)
jest.mock('path');

export const pathJoinAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = jest.mocked(join);

  // Default mock behavior - return joined path
  mock.mockImplementation((...segments) => segments.join('/'));

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }) => {
      mock.mockReturnValueOnce(result);
    },
  };
};
