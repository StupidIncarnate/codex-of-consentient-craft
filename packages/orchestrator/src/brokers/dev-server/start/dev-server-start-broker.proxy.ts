import type { ChildProcess } from 'child_process';

import { childProcessSpawnAdapterProxy } from '../../../adapters/child-process/spawn/child-process-spawn-adapter.proxy';
import { httpReadinessPollAdapterProxy } from '../../../adapters/http/readiness-poll/http-readiness-poll-adapter.proxy';
import { processKillByPortAdapterProxy } from '../../../adapters/process/kill-by-port/process-kill-by-port-adapter.proxy';

export const devServerStartBrokerProxy = (): {
  setupServerBecomesReady: () => ChildProcess;
  setupServerExitsBeforeReady: (params: { exitCode: number }) => void;
  setupServerReadinessTimeout: () => ChildProcess;
  wasKillByPortCalledForBothPorts: () => boolean;
} => {
  const killByPortProxy = processKillByPortAdapterProxy();
  const spawnProxy = childProcessSpawnAdapterProxy();
  const readinessProxy = httpReadinessPollAdapterProxy();

  return {
    setupServerBecomesReady: (): ChildProcess => {
      killByPortProxy.portIsEmpty();
      killByPortProxy.portIsEmpty();
      const proc = spawnProxy.setupSuccess({ exitCode: 0 as never });
      readinessProxy.respondsWithStatus({ status: 200, ok: true });
      return proc;
    },

    setupServerExitsBeforeReady: ({ exitCode }: { exitCode: number }): void => {
      killByPortProxy.portIsEmpty();
      killByPortProxy.portIsEmpty();
      // Get mock process, override once() so exit event fires immediately when listener attaches
      const proc = spawnProxy.setupSuccess({ exitCode: exitCode as never });
      const originalOnce = proc.once.bind(proc);
      proc.once = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (event === 'exit') {
          setImmediate(() => {
            (handler as (code: number | null) => void)(exitCode);
          });
        }
        return originalOnce(event as never, handler as never);
      }) as unknown as typeof proc.once;
      // Poll resolves slowly — exit race wins first
      readinessProxy.throwsNetworkError({ error: new Error('ECONNREFUSED') });
    },

    setupServerReadinessTimeout: (): ChildProcess => {
      killByPortProxy.portIsEmpty();
      killByPortProxy.portIsEmpty();
      const proc = spawnProxy.setupSuccess({ exitCode: 0 as never });
      readinessProxy.respondsWithStatus({ status: 503, ok: false });
      return proc;
    },

    wasKillByPortCalledForBothPorts: (): boolean => killByPortProxy.wasCalledAtLeastTwice(),
  };
};
