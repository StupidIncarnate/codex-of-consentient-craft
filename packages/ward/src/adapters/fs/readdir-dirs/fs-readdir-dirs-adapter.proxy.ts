import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReaddirDirsAdapterProxy = (): {
  returns: (params: { dirs: string[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: readdir });

  mock.mockResolvedValue([] as never);

  return {
    returns: ({ dirs }: { dirs: string[] }): void => {
      mock.mockResolvedValueOnce(
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
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
