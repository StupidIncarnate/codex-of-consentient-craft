import type { FilePath } from '@dungeonmaster/shared/contracts';

import { guildListBrokerProxy } from '../../../brokers/guild/list/guild-list-broker.proxy';

import { RecoverGuildLayerResponderProxy } from './recover-guild-layer-responder.proxy';

export const OrchestrationStartupRecoveryResponderProxy = (): {
  setupEmpty: (params: { homeDir: string; homePath: FilePath }) => void;
} => {
  const guildListProxy = guildListBrokerProxy();
  RecoverGuildLayerResponderProxy();

  return {
    setupEmpty: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      guildListProxy.setupEmptyConfig({ homeDir, homePath });
    },
  };
};
