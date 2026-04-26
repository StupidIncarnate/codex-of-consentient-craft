/**
 * PURPOSE: Proxy for processTerminalEventLayerBroker — two roles:
 *   1) Sibling tests of createTerminalHandlerLayerBroker stub this broker via setupSucceeds
 *      so the dispatched fire-and-forget call can be asserted without driving the file system.
 *   2) The broker's own test composes child proxies for end-to-end assertion (no module mock).
 *
 * USAGE (sibling test):
 * const proxy = processTerminalEventLayerBrokerProxy();
 * proxy.setupSucceeds();
 *
 * WHY registerModuleMock: createTerminalHandlerLayerBroker imports processTerminalEventLayerBroker
 * directly. Stack-based registerMock dispatch can match the handler's call site, but module-level
 * mocking is cleaner and matches questPauseBroker's pattern.
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { processTerminalEventLayerBroker } from './process-terminal-event-layer-broker';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../../quest/persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../../quest/with-modify-lock/quest-with-modify-lock-broker.proxy';
import { smoketestAssertFinalStateBrokerProxy } from '../assert-final-state/smoketest-assert-final-state-broker.proxy';
import { smoketestRunTeardownChecksBrokerProxy } from '../run-teardown-checks/smoketest-run-teardown-checks-broker.proxy';

registerModuleMock({ module: './process-terminal-event-layer-broker' });

export const processTerminalEventLayerBrokerProxy = (): {
  reset: () => void;
  setupSucceeds: () => void;
  setupRejects: (params: { error: Error }) => void;
  setupPassthrough: () => void;
  setupQuestDeleted: (params: { homeDir: string; homePath: FilePath; guildsDir: FilePath }) => void;
  getCallArgs: () => readonly unknown[][];
} => {
  pathJoinAdapterProxy();
  const findProxy = questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();
  questPersistBrokerProxy();
  questWithModifyLockBrokerProxy();
  smoketestAssertFinalStateBrokerProxy();
  smoketestRunTeardownChecksBrokerProxy();

  const mocked = processTerminalEventLayerBroker as jest.MockedFunction<
    typeof processTerminalEventLayerBroker
  >;
  // Default: resolve success so dispatched fire-and-forget calls don't throw.
  mocked.mockResolvedValue({ success: true });

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    setupSucceeds: (): void => {
      mocked.mockResolvedValueOnce({ success: true });
    },
    setupRejects: ({ error }: { error: Error }): void => {
      mocked.mockRejectedValueOnce(error);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        processTerminalEventLayerBroker: typeof processTerminalEventLayerBroker;
      }>({
        module: './process-terminal-event-layer-broker',
      });
      mocked.mockImplementation(realMod.processTerminalEventLayerBroker);
    },
    setupQuestDeleted: ({
      homeDir,
      homePath,
      guildsDir,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
    }): void => {
      // Simulates the "quest was deleted between the outbox event firing and this handler
      // running" case — `questFindQuestPathBroker` throws "not found in any guild" when no
      // guild dirs exist on disk.
      findProxy.setupNoGuilds({ homeDir, homePath, guildsDir });
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
