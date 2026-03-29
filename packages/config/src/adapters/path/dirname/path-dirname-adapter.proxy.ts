import { dirname } from 'path';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const pathDirnameAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: dirname });

  // Default mock behavior - return same path as directory
  mock.mockImplementation((inputPath: string) => inputPath);

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }) => {
      mock.mockReturnValueOnce(result);
    },
  };
};
