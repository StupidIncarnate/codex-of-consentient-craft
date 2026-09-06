import { exec } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { NetworkPort } from '@dungeonmaster/shared/contracts';

export const netPortInUseAdapterProxy = (): {
  inUse: (params: { port: NetworkPort }) => void;
  free: (params: { port: NetworkPort }) => void;
} => {
  const mockExec = registerMock({ fn: exec });

  // `exec` answers through a callback rather than a promise, so the staging has to CALL the
  // callback the adapter handed it. Address by the command string, so two ports can be staged
  // differently in one test.
  const stage = ({ port, stdout }: { port: NetworkPort; stdout: string }): void => {
    mockExec
      .calledWith([`lsof -ti :${String(port)}`])
      .implement(
        (
          _command: unknown,
          callback: (error: Error | null, stdout: unknown, stderr: unknown) => void,
        ) => {
          callback(null, stdout, '');
        },
      );
  };

  return {
    inUse: ({ port }: { port: NetworkPort }): void => {
      stage({ port, stdout: '48273\n' });
    },
    free: ({ port }: { port: NetworkPort }): void => {
      stage({ port, stdout: '' });
    },
  };
};
