import { unlinkSync } from 'fs';

jest.mock('fs');

export const fsUnlinkAdapterProxy = (): {
  throws: ({ error }: { filePath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(unlinkSync);

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
