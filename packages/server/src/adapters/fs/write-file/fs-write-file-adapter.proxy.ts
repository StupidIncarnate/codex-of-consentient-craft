import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: writeFile });
  mock.mockResolvedValue(undefined);

  return {
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
