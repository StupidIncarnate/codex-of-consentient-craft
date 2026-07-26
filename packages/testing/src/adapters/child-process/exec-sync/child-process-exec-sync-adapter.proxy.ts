/**
 * PURPOSE: Proxy for child-process-exec-sync-adapter
 *
 * USAGE:
 * const proxy = childProcessExecSyncAdapterProxy();
 * proxy.returns({ command: 'ls', output: Buffer.from('file.txt') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { execSync } from 'child_process';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';
import { registerMock } from '../../../register-mock';

export const childProcessExecSyncAdapterProxy = (): {
  returns: ({ command, output }: { command: string; output: Buffer | FileContent }) => void;
  throws: ({ command, error }: { command: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: execSync });

  mock.calledWith([]).returns(Buffer.from(''));

  return {
    returns: ({ command, output }: { command: string; output: Buffer | FileContent }): void => {
      mock.calledWith([command]).returns(output);
    },
    throws: ({ command, error }: { command: string; error: Error }): void => {
      mock.calledWith([command]).throws(error);
    },
  };
};
