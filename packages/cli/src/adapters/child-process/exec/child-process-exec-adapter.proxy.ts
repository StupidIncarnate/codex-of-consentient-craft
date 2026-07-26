import { exec } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const childProcessExecAdapterProxy = (): {
  succeeds: ({ command }: { command: string }) => void;
  getExecCalls: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: exec });

  return {
    succeeds: ({ command }: { command: string }): void => {
      handle.calledWith([command]).returns(undefined);
    },
    getExecCalls: (): readonly unknown[] => handle.callsMatching([]).map((call) => call[0]),
  };
};
