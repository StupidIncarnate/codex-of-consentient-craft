/**
 * PURPOSE: Proxy for OrchestrationStartupRecoveryResponder that delegates to RecoverGuildLayerResponder
 *
 * USAGE:
 * const proxy = OrchestrationStartupRecoveryResponderProxy();
 * proxy.setupGuildWithQuests({guildId, guildPath, quests});
 * await OrchestrationStartupRecoveryResponder({guildItems});
 */

import type { GuildId, GuildPath, ProcessId, QuestStub } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { RecoverGuildLayerResponderProxy } from './recover-guild-layer-responder.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationStartupRecoveryResponderProxy = (): {
  setupGuildWithQuests: (params: {
    guildId: GuildId;
    guildPath: GuildPath;
    quests: Quest[];
  }) => void;
  getRegisteredProcessIds: () => readonly ProcessId[];
} => {
  const layerProxy = RecoverGuildLayerResponderProxy();

  return {
    setupGuildWithQuests: layerProxy.setupGuildWithQuests,

    getRegisteredProcessIds: (): readonly ProcessId[] => orchestrationProcessesState.getAll(),
  };
};
