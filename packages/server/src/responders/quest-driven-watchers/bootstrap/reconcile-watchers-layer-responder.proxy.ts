import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

// This tree mocks BOTH `StartOrchestrator` methods (listGuilds, startMonitorWatcher) and the bare
// `questListBroker` export, and the two cannot be mocked independently: mocking a bare export
// replaces the whole `@dungeonmaster/orchestrator` module, so a separately-registered
// StartOrchestrator method mock stops intercepting and the REAL guild list is read off the
// developer's own ~/.dungeonmaster. One factory supplying both is what keeps them coexisting —
// the same shape quest-chat-responder.proxy.ts uses for questFindQuestPathBroker.
registerModuleMock({
  module: '@dungeonmaster/orchestrator',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/orchestrator'),
    // Replaced WHOLE rather than spread from the real object: spreading it forces the barrel's
    // own module-load bootstraps to evaluate inside the factory, which runs before the test
    // file's imports have initialised.
    StartOrchestrator: {
      listGuilds: jest.fn(),
      startMonitorWatcher: jest.fn(),
    },
    questListBroker: jest.fn(),
  }),
});

import { orchestratorListGuildsAdapterProxy } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import { orchestratorListQuestsFullAdapterProxy } from '../../../adapters/orchestrator/list-quests-full/orchestrator-list-quests-full-adapter.proxy';
import { orchestratorStartMonitorWatcherAdapterProxy } from '../../../adapters/orchestrator/start-monitor-watcher/orchestrator-start-monitor-watcher-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

export const ReconcileWatchersLayerResponderProxy = (): {
  guildsProxy: ReturnType<typeof orchestratorListGuildsAdapterProxy>;
  questsProxy: ReturnType<typeof orchestratorListQuestsFullAdapterProxy>;
  startWatcherProxy: ReturnType<typeof orchestratorStartMonitorWatcherAdapterProxy>;
  devLogProxy: ReturnType<typeof processDevLogAdapterProxy>;
} => ({
  guildsProxy: orchestratorListGuildsAdapterProxy(),
  // The responder reads each guild's quests WHOLE — it needs their work items, and a summary
  // carries none. There is no second per-quest load to stage behind this one.
  questsProxy: orchestratorListQuestsFullAdapterProxy(),
  startWatcherProxy: orchestratorStartMonitorWatcherAdapterProxy(),
  devLogProxy: processDevLogAdapterProxy(),
});
