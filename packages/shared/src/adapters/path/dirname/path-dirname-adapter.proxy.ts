import { dirname } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathDirnameAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: dirname });

  // Default mock behavior - return same path as directory
  handle.mockImplementation((inputPath: string) => inputPath);

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }) => {
      handle.mockReturnValueOnce(result);
    },
  };
};
