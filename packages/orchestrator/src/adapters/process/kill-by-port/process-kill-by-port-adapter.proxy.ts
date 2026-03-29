import { execSync } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const processKillByPortAdapterProxy = (): {
  portHasPids: (params: { pids: number[] }) => void;
  portIsEmpty: () => void;
  lsofThrows: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: execSync });

  handle.mockReturnValue('');

  return {
    portHasPids: ({ pids }: { pids: number[] }): void => {
      const lsofOutput = pids.join('\n');
      handle.mockReturnValueOnce(lsofOutput);
      handle.mockReturnValue(undefined as never);
    },

    portIsEmpty: (): void => {
      handle.mockReturnValueOnce('');
    },

    lsofThrows: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
