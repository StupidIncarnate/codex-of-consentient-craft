import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FileName } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapterProxy = (): {
  returns: (params: { files: FileName[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readdirSync });

  mock.mockReturnValue([]);

  return {
    returns: ({ files }: { files: FileName[] }): void => {
      mock.mockReturnValueOnce(files as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
