import { join } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: join });

  // Default mock behavior - return joined path
  handle.mockImplementation((...segments) => segments.join('/'));

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }) => {
      handle.mockReturnValueOnce(result);
    },
  };
};
