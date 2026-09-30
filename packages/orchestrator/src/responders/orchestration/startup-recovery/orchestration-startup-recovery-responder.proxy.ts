/**
 * PURPOSE: Proxy for OrchestrationStartupRecoveryResponder that delegates to RecoverGuildLayerResponder
 *
 * USAGE:
 * const proxy = OrchestrationStartupRecoveryResponderProxy();
 * proxy.setupGuildWithQuests({guildId, guildPath, quests});
 * await OrchestrationStartupRecoveryResponder({guildItems});
 */

import type { Guild } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { RecoverGuildLayerResponderProxy } from './recover-guild-layer-responder.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationStartupRecoveryResponderProxy = (): {
  setupGuildWithQuests: (params: {
    guildId: Guild['id'];
    guildPath: string;
    quests: Quest[];
  }) => void;
  getRegisteredProcessIds: () => readonly string[];
} => {
  const layerProxy = RecoverGuildLayerResponderProxy();

  return {
    setupGuildWithQuests: layerProxy.setupGuildWithQuests,

    getRegisteredProcessIds: (): readonly string[] => orchestrationProcessesState.getAll(),
  };
};
