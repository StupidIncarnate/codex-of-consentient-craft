jest.mock('child_process');

import { spawn } from 'child_process';
import type { ChildProcess as NodeChildProcess } from 'child_process';
import { ChildProcessStub } from '../../../contracts/child-process/child-process.stub';
import type { ChildProcess } from '../../../contracts/child-process/child-process-contract';

export const childProcessSpawnAdapterProxy = (): {
  returns: ({ childProcess }: { childProcess: ChildProcess }) => void;
} => {
  const mock = jest.mocked(spawn);

  const defaultChildProcess = ChildProcessStub();
  mock.mockReturnValue(defaultChildProcess as NodeChildProcess);

  return {
    returns: ({ childProcess }: { childProcess: ChildProcess }) => {
      mock.mockReturnValueOnce(childProcess as NodeChildProcess);
    },
  };
};
