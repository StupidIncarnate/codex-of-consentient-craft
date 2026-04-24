/**
 * PURPOSE: Proxy for processSyncEventLayerBroker — sibling tests of createSyncHandlerLayerBroker stub this broker so the dispatched fire-and-forget call can be asserted without driving the real state/filesystem. The broker's own test uses passthrough for end-to-end assertions.
 *
 * USAGE (sibling test):
 * const proxy = processSyncEventLayerBrokerProxy();
 * proxy.setupSucceeds();
 */

import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { processSyncEventLayerBroker } from './process-sync-event-layer-broker';

registerModuleMock({ module: './process-sync-event-layer-broker' });

export const processSyncEventLayerBrokerProxy = (): {
  reset: () => void;
  setupSucceeds: () => void;
  setupRejects: (params: { error: Error }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const mocked = processSyncEventLayerBroker as jest.MockedFunction<
    typeof processSyncEventLayerBroker
  >;
  // Default: resolve success so dispatched fire-and-forget calls don't throw.
  mocked.mockResolvedValue({ success: true });

  return {
    reset: (): void => {
      // jest.clearAllMocks (from @dungeonmaster/testing setup) resets call history per test.
    },
    setupSucceeds: (): void => {
      mocked.mockResolvedValueOnce({ success: true });
    },
    setupRejects: ({ error }: { error: Error }): void => {
      mocked.mockRejectedValueOnce(error);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual({ module: './process-sync-event-layer-broker' });
      const realImpl = Reflect.get(
        realMod as object,
        'processSyncEventLayerBroker',
      ) as typeof processSyncEventLayerBroker;
      mocked.mockImplementation(realImpl);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
