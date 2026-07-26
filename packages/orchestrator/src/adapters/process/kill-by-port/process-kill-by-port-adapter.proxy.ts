import { execSync } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// execSync backs TWO distinct commands the adapter issues: `lsof -ti :<port>` to list pids
// listening on the port, and `kill -9 <pid>` for each pid it finds. The full command string
// is the real, distinguishing address for both.
export const processKillByPortAdapterProxy = (): {
  portHasPids: (params: { port: number; pids: number[] }) => void;
  portIsEmpty: (params: { port: number }) => void;
  lsofThrows: (params: { port: number; error: Error }) => void;
  wasCalledForPort: (params: { port: number }) => boolean;
} => {
  const handle = registerMock({ fn: execSync });

  return {
    portHasPids: ({ port, pids }: { port: number; pids: number[] }): void => {
      const lsofOutput = pids.join('\n');
      handle.calledWith([`lsof -ti :${port}`, { encoding: 'utf8' }]).returns(lsofOutput);
      // Each pid lsof reports is killed with its own `kill -9 <pid>` call.
      for (const pid of pids) {
        handle.calledWith([`kill -9 ${pid}`]).returns(undefined as never);
      }
    },

    portIsEmpty: ({ port }: { port: number }): void => {
      handle.calledWith([`lsof -ti :${port}`, { encoding: 'utf8' }]).returns('');
    },

    lsofThrows: ({ port, error }: { port: number; error: Error }): void => {
      handle.calledWith([`lsof -ti :${port}`, { encoding: 'utf8' }]).implement(() => {
        throw error;
      });
    },

    wasCalledForPort: ({ port }: { port: number }): boolean =>
      handle.callsMatching([`lsof -ti :${port}`]).length > 0,
  };
};
