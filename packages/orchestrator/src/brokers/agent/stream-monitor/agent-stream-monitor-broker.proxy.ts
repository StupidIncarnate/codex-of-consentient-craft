import type { ExitCode } from '@dungeonmaster/shared/contracts';
import { EventEmitter } from 'events';

import { readlineCreateInterfaceAdapterProxy } from '../../../adapters/readline/create-interface/readline-create-interface-adapter.proxy';

export const agentStreamMonitorBrokerProxy = (): {
  setupStreamAndExit: (params: { lines: readonly string[]; exitCode: ExitCode | null }) => {
    mockProcess: EventEmitter & { kill: jest.Mock };
  };
  setupStreamAndExitOnKill: (params: { lines: readonly string[]; exitCode: ExitCode | null }) => {
    mockProcess: EventEmitter & { kill: jest.Mock };
  };
} => {
  const readlineProxy = readlineCreateInterfaceAdapterProxy();

  return {
    setupStreamAndExit: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode | null;
    }): { mockProcess: EventEmitter & { kill: jest.Mock } } => {
      const mockProcess = new EventEmitter() as EventEmitter & { kill: jest.Mock };
      mockProcess.kill = jest.fn().mockReturnValue(true);

      // Emit lines then exit asynchronously
      setImmediate(() => {
        readlineProxy.emitLines({ lines });
        setImmediate(() => {
          mockProcess.emit('exit', exitCode);
        });
      });

      return { mockProcess };
    },

    setupStreamAndExitOnKill: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode | null;
    }): { mockProcess: EventEmitter & { kill: jest.Mock } } => {
      const mockProcess = new EventEmitter() as EventEmitter & { kill: jest.Mock };

      // Only exit when kill() is called (for timeout testing with fake timers)
      mockProcess.kill = jest.fn().mockImplementation(() => {
        readlineProxy.emitLines({ lines });
        // Use process.nextTick to ensure compatibility with jest fake timers
        process.nextTick(() => {
          mockProcess.emit('exit', exitCode);
        });
        return true;
      });

      return { mockProcess };
    },
  };
};
