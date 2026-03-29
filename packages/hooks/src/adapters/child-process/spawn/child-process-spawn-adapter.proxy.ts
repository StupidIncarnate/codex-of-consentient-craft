import { spawn } from 'child_process';
import type { ChildProcess as NodeChildProcess } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { ChildProcessStub } from '../../../contracts/child-process/child-process.stub';
import type { ChildProcess } from '../../../contracts/child-process/child-process-contract';

export const childProcessSpawnAdapterProxy = (): {
  returns: ({ childProcess }: { childProcess: ChildProcess }) => void;
} => {
  const mock = registerMock({ fn: spawn });

  const defaultChildProcess = ChildProcessStub();
  mock.mockReturnValue(defaultChildProcess as NodeChildProcess);

  return {
    returns: ({ childProcess }: { childProcess: ChildProcess }) => {
      mock.mockReturnValueOnce(childProcess as NodeChildProcess);
    },
  };
};
