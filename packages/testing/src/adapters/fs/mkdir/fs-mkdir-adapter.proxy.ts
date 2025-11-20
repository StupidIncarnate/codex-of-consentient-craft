import { mkdirSync } from 'fs';

jest.mock('fs');

export const fsMkdirAdapterProxy = (): {
  throws: ({ error }: { dirPath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(mkdirSync);

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { dirPath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
