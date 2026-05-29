import { orchestratorListGuildsAdapterProxy } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { orchestratorStartMonitorWatcherAdapterProxy } from '../../../adapters/orchestrator/start-monitor-watcher/orchestrator-start-monitor-watcher-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

export const ReconcileWatchersLayerResponderProxy = (): {
  guildsProxy: ReturnType<typeof orchestratorListGuildsAdapterProxy>;
  questsProxy: ReturnType<typeof orchestratorListQuestsAdapterProxy>;
  loadQuestProxy: ReturnType<typeof orchestratorLoadQuestAdapterProxy>;
  startWatcherProxy: ReturnType<typeof orchestratorStartMonitorWatcherAdapterProxy>;
  devLogProxy: ReturnType<typeof processDevLogAdapterProxy>;
} => ({
  guildsProxy: orchestratorListGuildsAdapterProxy(),
  questsProxy: orchestratorListQuestsAdapterProxy(),
  loadQuestProxy: orchestratorLoadQuestAdapterProxy(),
  startWatcherProxy: orchestratorStartMonitorWatcherAdapterProxy(),
  devLogProxy: processDevLogAdapterProxy(),
});
