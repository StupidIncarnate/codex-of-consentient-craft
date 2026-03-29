import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadJsonSyncAdapterProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  mock.mockReturnValue('' as never);

  return {
    returns: ({ content }: { content: string }): void => {
      mock.mockReturnValueOnce(content as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
