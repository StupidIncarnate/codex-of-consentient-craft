import { rmSync } from 'fs';

jest.mock('fs');

export const fsRmAdapterProxy = (): {
  throws: ({ error }: { filePath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(rmSync);

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
