import { orchestratorSessionIdExtractorAdapterProxy } from '../../../adapters/orchestrator/session-id-extractor/orchestrator-session-id-extractor-adapter.proxy';
import { orchestratorSignalFromStreamAdapterProxy } from '../../../adapters/orchestrator/signal-from-stream/orchestrator-signal-from-stream-adapter.proxy';
import { readlineCreateInterfaceAdapterProxy } from '../../../adapters/readline/create-interface/readline-create-interface-adapter.proxy';
import { timerClearTimeoutAdapterProxy } from '../../../adapters/timer/clear-timeout/timer-clear-timeout-adapter.proxy';
import { scheduleTimeoutLayerBrokerProxy } from './schedule-timeout-layer-broker.proxy';
import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { EventEmittingProcess } from '../../../contracts/event-emitting-process/event-emitting-process-contract';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';

type Listeners = Record<PropertyKey, ((...args: unknown[]) => void)[]>;

const createMockProcess = ({
  listeners,
  exitCode,
}: {
  listeners: Listeners;
  exitCode: ExitCode | null;
}): EventEmittingProcess => ({
  kill: () => {
    setImmediate(() => {
      const exitListeners = listeners.exit;
      if (exitListeners) {
        for (const listener of exitListeners) {
          listener(exitCode);
        }
      }
    });
    return true;
  },
  on: (...args: unknown[]): unknown => {
    const [event, listener] = args as [PropertyKey, (...args: unknown[]) => void];
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(listener);
    return undefined;
  },
});

export const agentStreamMonitorBrokerProxy = (): {
  setupStreamWithLines: (params: { lines: readonly StreamJsonLine[] }) => void;
  setupEmptyStream: () => void;
  setupTimeoutFires: () => void;
  returnsProcessWithExit: (params: { exitCode: ExitCode }) => EventEmittingProcess;
  returnsProcessWithExitOnKill: (params: { exitCode: ExitCode | null }) => EventEmittingProcess;
  returnsProcessWithNullExit: () => EventEmittingProcess;
  returnsProcessWithError: (params: { error: Error }) => EventEmittingProcess;
} => {
  orchestratorSessionIdExtractorAdapterProxy();
  orchestratorSignalFromStreamAdapterProxy();
  const rlProxy = readlineCreateInterfaceAdapterProxy();
  timerClearTimeoutAdapterProxy();
  const timeoutProxy = scheduleTimeoutLayerBrokerProxy();

  return {
    setupStreamWithLines: ({ lines }: { lines: readonly StreamJsonLine[] }): void => {
      rlProxy.setupLines({ lines });
    },

    setupEmptyStream: (): void => {
      rlProxy.setupEmpty();
    },

    setupTimeoutFires: (): void => {
      timeoutProxy.setupImmediate();
    },

    returnsProcessWithExit: ({ exitCode }: { exitCode: ExitCode }): EventEmittingProcess => {
      const listeners: Listeners = {};
      const process = createMockProcess({ listeners, exitCode });

      // Use nested setImmediate to ensure exit fires after readline lines are emitted
      setImmediate(() => {
        setImmediate(() => {
          const exitListeners = listeners.exit;
          if (exitListeners) {
            for (const listener of exitListeners) {
              listener(exitCode);
            }
          }
        });
      });

      return process;
    },

    returnsProcessWithExitOnKill: ({
      exitCode,
    }: {
      exitCode: ExitCode | null;
    }): EventEmittingProcess => {
      const listeners: Listeners = {};
      return createMockProcess({ listeners, exitCode });
    },

    returnsProcessWithNullExit: (): EventEmittingProcess => {
      const listeners: Listeners = {};
      const process = createMockProcess({ listeners, exitCode: null });

      // Use nested setImmediate to ensure exit fires after readline lines are emitted
      setImmediate(() => {
        setImmediate(() => {
          const exitListeners = listeners.exit;
          if (exitListeners) {
            for (const listener of exitListeners) {
              listener(null);
            }
          }
        });
      });

      return process;
    },

    returnsProcessWithError: ({ error }: { error: Error }): EventEmittingProcess => {
      const listeners: Listeners = {};
      const process = createMockProcess({ listeners, exitCode: null });

      // Use nested setImmediate to ensure error fires after readline lines are emitted
      setImmediate(() => {
        setImmediate(() => {
          const errorListeners = listeners.error;
          if (errorListeners) {
            for (const listener of errorListeners) {
              listener(error);
            }
          }
        });
      });

      return process;
    },
  };
};
