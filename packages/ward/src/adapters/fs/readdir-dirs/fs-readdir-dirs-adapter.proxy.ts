import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReaddirDirsAdapterProxy = (): {
  returns: (params: { dirPath: FilePath; dirs: string[] }) => void;
  throws: (params: { dirPath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readdir });

  return {
    returns: ({ dirPath, dirs }: { dirPath: FilePath; dirs: string[] }): void => {
      mock.calledWith([dirPath]).resolves(
        dirs.map((name) => ({
          name,
          isDirectory: () => true,
          isFile: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isFIFO: () => false,
          isSocket: () => false,
          isSymbolicLink: () => false,
        })) as never,
      );
    },
    throws: ({ dirPath, error }: { dirPath: FilePath; error: Error }): void => {
      mock.calledWith([dirPath]).rejects(error);
    },
  };
};
