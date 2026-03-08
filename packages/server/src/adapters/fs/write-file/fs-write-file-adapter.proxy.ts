import { writeFile } from 'fs/promises';

jest.mock('fs/promises', () => ({
  ...jest.requireActual('fs/promises'),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

export const fsWriteFileAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(writeFile);
  mock.mockResolvedValue(undefined);

  return {
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
