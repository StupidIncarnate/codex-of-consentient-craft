import { execSync } from 'child_process';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';

jest.mock('child_process');

export const childProcessExecSyncAdapterProxy = (): {
  returns: ({ output }: { command: string; output: Buffer | FileContent }) => void;
  throws: ({ error }: { command: string; error: Error }) => void;
} => {
  const mock = jest.mocked(execSync);

  mock.mockReturnValue(Buffer.from(''));

  return {
    returns: ({ output }: { command: string; output: Buffer | FileContent }): void => {
      mock.mockReturnValueOnce(output as never);
    },
    throws: ({ error }: { command: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
