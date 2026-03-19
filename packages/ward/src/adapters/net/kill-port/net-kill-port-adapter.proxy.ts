import { exec } from 'child_process';

jest.mock('child_process');

interface ExecCall {
  command: unknown;
}

export const netKillPortAdapterProxy = (): {
  setupPids: ({ pids }: { pids: unknown[] }) => void;
  setupNoPids: () => void;
  getExecCalls: () => ExecCall[];
} => {
  const calls: ExecCall[] = [];
  const mockExec = jest.mocked(exec) as unknown as jest.Mock;

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
