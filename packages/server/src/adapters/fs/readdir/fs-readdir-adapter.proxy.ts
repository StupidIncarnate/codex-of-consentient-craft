import { readdir } from 'fs/promises';

jest.mock('fs/promises');

export const fsReaddirAdapterProxy = (): {
  returns: (params: { files: string[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mockReaddir = jest.mocked(readdir);

  (mockReaddir as jest.Mock).mockResolvedValue([]);

  return {
    returns: ({ files }: { files: string[] }): void => {
      (mockReaddir as jest.Mock).mockResolvedValueOnce(files);
    },
    throws: ({ error }: { error: Error }): void => {
      (mockReaddir as jest.Mock).mockRejectedValueOnce(error);
    },
  };
};
