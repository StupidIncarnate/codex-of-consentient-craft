/**
 * Proxy for testing index.ts entry point
 * Records process.exit, stderr writes and signal handlers through the gateway process proxies
 */

import { resolve } from '#gateway/node/path';
import { exitProxy } from '#gateway/node/process/exit/exit.proxy';
import { onProxy } from '#gateway/node/process/on/on.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { isolateModules } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const indexProxy = (): {
  getExitCalls: () => RecordedCalls;
  getStderrWrites: () => readonly unknown[];
  loadIndexWithStartupBehavior: (startMcpServerBehavior: () => Promise<void>) => Promise<void>;
  simulateSignal: (params: { signal: 'SIGTERM' | 'SIGINT' }) => void;
} => {
  const exitChild = exitProxy();
  const stderrChild = stderrProxy();
  // Signal handlers are recorded rather than attached, so no test leaves a live listener behind and
  // simulateSignal runs exactly the handlers this load registered.
  const onChild = onProxy();

  /**
   * Load index with custom StartMcpServer behavior to test entry point
   * Uses isolateModules to prevent module cache pollution
   */
  const loadIndexWithStartupBehavior = async (
    startMcpServerBehavior: () => Promise<void>,
  ): Promise<void> => {
    await isolateModules({
      mocks: [
        {
          module: resolve(__dirname, './startup/start-mcp-server'),
          factory: () => ({
            StartMcpServer: startMcpServerBehavior,
          }),
        },
      ],
      entrypoint: resolve(__dirname, './index'),
    });
  };

  const simulateSignal = ({ signal }: { signal: 'SIGTERM' | 'SIGINT' }): void => {
    // A recorded call's second argument IS the handler index.ts registered for that event.
    const handlers = onChild
      .callsMatching()
      .filter((call) => call[0] === signal)
      .map((call) => call[1] as () => void);
    for (const handler of handlers) {
      handler();
    }
  };

  return {
    getExitCalls: (): RecordedCalls => exitChild.callsMatching(),
    getStderrWrites: (): readonly unknown[] => stderrChild.getWrites(),
    loadIndexWithStartupBehavior,
    simulateSignal,
  };
};
