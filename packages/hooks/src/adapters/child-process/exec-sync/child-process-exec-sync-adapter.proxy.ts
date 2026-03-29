import { execSync } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const childProcessExecSyncAdapterProxy = (): {
  returns: ({ output }: { output: string | Buffer }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: execSync });

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
