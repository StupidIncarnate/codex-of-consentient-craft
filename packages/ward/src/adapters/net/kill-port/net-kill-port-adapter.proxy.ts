import { exec } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface ExecCall {
  command: unknown;
}

export const netKillPortAdapterProxy = (): {
  setupPids: ({ pids }: { pids: unknown[] }) => void;
  setupNoPids: () => void;
  getExecCalls: () => ExecCall[];
} => {
  const calls: ExecCall[] = [];
  const mockExec = registerMock({ fn: exec });

  const setupImpl = ({ stdout }: { stdout: unknown }): void => {
    mockExec.mockImplementation(
      (
        command: unknown,
        callback: (error: Error | null, stdout: unknown, stderr: unknown) => void,
      ) => {
        calls.push({ command });
        callback(null, stdout, '');
      },
    );
  };

  setupImpl({ stdout: '' });

  return {
    setupPids: ({ pids }: { pids: unknown[] }): void => {
      setupImpl({ stdout: `${pids.join('\n')}\n` });
    },
    setupNoPids: (): void => {
      setupImpl({ stdout: '' });
    },
    getExecCalls: (): ExecCall[] => calls,
  };
};
