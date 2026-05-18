import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';

import { questMonitorJsonlWatcherBrokerProxy } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.proxy';
import { questOrphanResetBrokerProxy } from '../orphan-reset/quest-orphan-reset-broker.proxy';

export const questMonitorWatcherStartBrokerProxy = (): {
  setupHomeDir: (params: { path: string }) => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const orphanResetProxy = questOrphanResetBrokerProxy();
  // Default: no guilds — orphan reset returns 0 without touching the fs chain.
  orphanResetProxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });

  const jsonlWatcherProxy = questMonitorJsonlWatcherBrokerProxy();
  // Default: no pre-existing sub-agent directory — main JSONL tail is the only watcher.
  jsonlWatcherProxy.setupSubagentDirMissing({ error: new Error('ENOENT: no subagents dir') });

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
    },
  };
};
