/**
 * PURPOSE: Proxy for RecoverGuildLayerResponder that mocks filesystem, state, and orchestration dependencies
 *
 * USAGE:
 * const proxy = RecoverGuildLayerResponderProxy();
 * proxy.setupGuildWithQuests({guildId, guildPath, quests});
 * await RecoverGuildLayerResponder({guildItem});
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { GuildConfigStub, GuildStub } from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  GuildPath,
  ProcessId,
  QuestId,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

type Quest = ReturnType<typeof QuestStub>;

export const RecoverGuildLayerResponderProxy = (): {
  setupGuildWithQuests: (params: {
    guildId: GuildId;
    guildPath: GuildPath;
    quests: Quest[];
  }) => void;
  setupGuildWithExistingProcess: (params: {
    guildId: GuildId;
    guildPath: GuildPath;
    quests: Quest[];
    existingProcessQuestId: QuestId;
  }) => void;
  getRegisteredProcessIds: () => readonly ProcessId[];
} => {
  const guildGetProxy = guildGetBrokerProxy();
  const questListProxy = questListBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  pathJoinAdapterProxy();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    setupGuildWithQuests: ({
      guildId,
      guildPath,
      quests,
    }: {
      guildId: GuildId;
      guildPath: GuildPath;
      quests: Quest[];
    }): void => {
      // Mock call order:
      // 1. questListBroker -> questResolveQuestsPathBroker -> homedir + pathJoin
      // 2. questListBroker -> fsReaddirAdapter (quest folder names)
      // 3. questListBroker -> pathJoin + questLoadBroker -> readFile (per quest)
      // 4. guildGetBroker -> guildConfigReadBroker -> homedir + pathJoin + readFile

      // Step 1-2: quests path resolution + directory listing
      questListProxy.setupQuestsPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster' as never,
        questsPath: `/home/user/.dungeonmaster/guilds/${guildId}/quests` as never,
      });
      questListProxy.setupQuestDirectories({
        files: quests.map((q) => q.folder) as never,
      });

      // Step 3: per-quest file path + JSON loading
      for (const quest of quests) {
        questListProxy.setupQuestFilePath({
          result:
            `/home/user/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json` as never,
        });
        questListProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
      }

      // Step 4: guild config for guildGetBroker
      guildGetProxy.setupConfig({
        config: GuildConfigStub({
          guilds: [GuildStub({ id: guildId, path: guildPath })],
        }),
      });
    },

    setupGuildWithExistingProcess: ({
      guildId,
      guildPath,
      quests,
      existingProcessQuestId,
    }: {
      guildId: GuildId;
      guildPath: GuildPath;
      quests: Quest[];
      existingProcessQuestId: QuestId;
    }): void => {
      // Same mock chain as setupGuildWithQuests
      questListProxy.setupQuestsPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster' as never,
        questsPath: `/home/user/.dungeonmaster/guilds/${guildId}/quests` as never,
      });
      questListProxy.setupQuestDirectories({
        files: quests.map((q) => q.folder) as never,
      });
      for (const quest of quests) {
        questListProxy.setupQuestFilePath({
          result:
            `/home/user/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json` as never,
        });
        questListProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
      }
      guildGetProxy.setupConfig({
        config: GuildConfigStub({
          guilds: [GuildStub({ id: guildId, path: guildPath })],
        }),
      });

      // Pre-register a process for the specified quest
      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId: 'proc-existing-process' as never,
          questId: existingProcessQuestId,
          kill: jest.fn(),
        },
      });
    },

    getRegisteredProcessIds: (): readonly ProcessId[] => orchestrationProcessesState.getAll(),
  };
};
