import { mkdir } from 'fs/promises';

jest.mock('fs/promises');

export const fsMkdirAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(mkdir);

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
