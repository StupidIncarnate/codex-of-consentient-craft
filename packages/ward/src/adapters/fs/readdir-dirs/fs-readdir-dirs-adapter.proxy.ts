import { readdir } from 'fs/promises';

jest.mock('fs/promises');

export const fsReaddirDirsAdapterProxy = (): {
  returns: (params: { dirs: string[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readdir);

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
