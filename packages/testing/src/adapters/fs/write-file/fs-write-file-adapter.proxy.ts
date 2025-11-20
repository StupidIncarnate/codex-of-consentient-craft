import { writeFileSync } from 'fs';

jest.mock('fs');

export const fsWriteFileAdapterProxy = (): {
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(writeFileSync);

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
