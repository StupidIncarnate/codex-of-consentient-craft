jest.mock('child_process');

import { execSync } from 'child_process';

export const childProcessExecSyncAdapterProxy = (): {
  returns: ({ output }: { output: string | Buffer }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mock = jest.mocked(execSync);

  mock.mockReturnValue(Buffer.from(''));

  return {
    returns: ({ output }: { output: string | Buffer }) => {
      mock.mockReturnValueOnce(output);
    },
    throws: ({ error }: { error: Error }) => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
