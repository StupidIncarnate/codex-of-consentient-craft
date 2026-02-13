import { readdirSync, type Dirent } from 'fs';

jest.mock('fs');

export const fsReaddirWithTypesAdapterProxy = (): {
  returns: ({ entries }: { entries: Dirent[] }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mock = jest.mocked(readdirSync);

  mock.mockReturnValue([]);

  return {
    returns: ({ entries }: { entries: Dirent[] }): void => {
      mock.mockReturnValueOnce(entries as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
