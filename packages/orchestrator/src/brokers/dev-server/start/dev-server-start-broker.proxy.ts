import type { ChildProcess } from 'child_process';

import { childProcessSpawnAdapterProxy } from '../../../adapters/child-process/spawn/child-process-spawn-adapter.proxy';
import { httpReadinessPollAdapterProxy } from '../../../adapters/http/readiness-poll/http-readiness-poll-adapter.proxy';
import { processKillByPortAdapterProxy } from '../../../adapters/process/kill-by-port/process-kill-by-port-adapter.proxy';

export const devServerStartBrokerProxy = (): {
  setupServerBecomesReady: (params: { port: number; pollUrl: string }) => ChildProcess;
  setupServerExitsBeforeReady: (params: {
    port: number;
    pollUrl: string;
    exitCode: number;
  }) => void;
  setupServerReadinessTimeout: (params: { port: number; pollUrl: string }) => ChildProcess;
  wasKillByPortCalledForBothPorts: (params: { port: number }) => boolean;
} => {
  const killByPortProxy = processKillByPortAdapterProxy();
  const spawnProxy = childProcessSpawnAdapterProxy();
  const readinessProxy = httpReadinessPollAdapterProxy();

  return {
    setupServerBecomesReady: ({
      port,
      pollUrl,
    }: {
      port: number;
      pollUrl: string;
    }): ChildProcess => {
      killByPortProxy.portIsEmpty({ port });
      killByPortProxy.portIsEmpty({ port: port + 1 });
      // Every caller of this proxy exercises devCommand: 'npm run dev', so the command
      // childProcessSpawnAdapter actually receives (the first whitespace-split token) is
      // always 'npm'.
      const proc = spawnProxy.setupSuccess({ command: 'npm', exitCode: 0 as never });
      readinessProxy.respondsWithStatus({ url: pollUrl, status: 200, ok: true });
      return proc;
    },

    setupServerExitsBeforeReady: ({
      port,
      pollUrl,
      exitCode,
    }: {
      port: number;
      pollUrl: string;
      exitCode: number;
    }): void => {
      killByPortProxy.portIsEmpty({ port });
      killByPortProxy.portIsEmpty({ port: port + 1 });
      // Get mock process, override once() so exit event fires immediately when listener attaches.
      // Every caller of this proxy exercises devCommand: 'npm run dev', so the command
      // childProcessSpawnAdapter actually receives is always 'npm'.
      const proc = spawnProxy.setupSuccess({ command: 'npm', exitCode: exitCode as never });
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
      readinessProxy.throwsNetworkError({ url: pollUrl, error: new Error('ECONNREFUSED') });
    },

    setupServerReadinessTimeout: ({
      port,
      pollUrl,
    }: {
      port: number;
      pollUrl: string;
    }): ChildProcess => {
      killByPortProxy.portIsEmpty({ port });
      killByPortProxy.portIsEmpty({ port: port + 1 });
      // Every caller of this proxy exercises devCommand: 'npm run dev', so the command
      // childProcessSpawnAdapter actually receives (the first whitespace-split token) is
      // always 'npm'.
      const proc = spawnProxy.setupSuccess({ command: 'npm', exitCode: 0 as never });
      readinessProxy.respondsWithStatus({ url: pollUrl, status: 503, ok: false });
      return proc;
    },

    wasKillByPortCalledForBothPorts: ({ port }: { port: number }): boolean =>
      killByPortProxy.wasCalledForPort({ port }) &&
      killByPortProxy.wasCalledForPort({ port: port + 1 }),
  };
};
