import { spawn } from 'child_process';
import type { ChildProcess as NodeChildProcess } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ChildProcess } from '../../../contracts/child-process/child-process-contract';

export const childProcessSpawnAdapterProxy = (): {
  returns: ({ command, childProcess }: { command: string; childProcess: ChildProcess }) => void;
} => {
  const mock = registerMock({ fn: spawn });

  return {
    returns: ({ command, childProcess }: { command: string; childProcess: ChildProcess }): void => {
      mock.calledWith([command]).returns(childProcess as NodeChildProcess);
    },
  };
};
