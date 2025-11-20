import { existsSync } from 'fs';

jest.mock('fs');

export const fsExistsAdapterProxy = (): {
  returns: ({ exists }: { filePath: string; exists: boolean }) => void;
} => {
  const mock = jest.mocked(existsSync);

  mock.mockReturnValue(false);

  return {
    returns: ({ exists }: { filePath: string; exists: boolean }): void => {
      mock.mockReturnValueOnce(exists);
    },
  };
};
