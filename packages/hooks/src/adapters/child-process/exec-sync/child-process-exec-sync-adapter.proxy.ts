import { execSync } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const childProcessExecSyncAdapterProxy = (): {
  returns: ({ command, output }: { command: string; output: string | Buffer }) => void;
  throws: ({ command, error }: { command: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: execSync });

  return {
    returns: ({ command, output }: { command: string; output: string | Buffer }): void => {
      mock.calledWith([command]).returns(output);
    },
    throws: ({ command, error }: { command: string; error: Error }): void => {
      mock.calledWith([command]).throws(error);
    },
  };
};
