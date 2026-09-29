import { execFileSync } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const runSyncProxy = (): {
  setupSuccess: (params: { command: string; stdout: string }) => void;
  setupNonZeroExit: (params: {
    command: string;
    status: number;
    stdout?: string;
    stderr?: string;
  }) => void;
  setupSignalKill: (params: {
    command: string;
    signal: NodeJS.Signals;
    stdout?: string;
    stderr?: string;
  }) => void;
  setupNotFound: (params: { command: string; code: string; message: string }) => void;
  getCallsFor: (params: { command: string }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: execFileSync });

  return {
    setupSuccess: ({ command, stdout }: { command: string; stdout: string }): void => {
      handle.calledWith([command]).returns(Buffer.from(stdout));
    },

    setupNonZeroExit: ({
      command,
      status,
      stdout,
      stderr,
    }: {
      command: string;
      status: number;
      stdout?: string;
      stderr?: string;
    }): void => {
      const error = Object.assign(new Error(`Command failed: ${command}`), {
        status,
        signal: null,
        stdout: Buffer.from(stdout ?? ''),
        stderr: Buffer.from(stderr ?? ''),
      });
      handle.calledWith([command]).implement(() => {
        throw error;
      });
    },

    setupSignalKill: ({
      command,
      signal,
      stdout,
      stderr,
    }: {
      command: string;
      signal: NodeJS.Signals;
      stdout?: string;
      stderr?: string;
    }): void => {
      const error = Object.assign(new Error(`Command failed: ${command}`), {
        status: null,
        signal,
        stdout: Buffer.from(stdout ?? ''),
        stderr: Buffer.from(stderr ?? ''),
      });
      handle.calledWith([command]).implement(() => {
        throw error;
      });
    },

    setupNotFound: ({
      command,
      code,
      message,
    }: {
      command: string;
      code: string;
      message: string;
    }): void => {
      const error = Object.assign(new Error(message), { code });
      handle.calledWith([command]).implement(() => {
        throw error;
      });
    },

    getCallsFor: ({ command }: { command: string }): readonly unknown[][] =>
      handle.callsMatching([command]),
  };
};
