import { writeFile } from 'fs/promises';

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}));

export const fsWriteFileAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(writeFile);

  mock.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce(undefined);
    },

    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
