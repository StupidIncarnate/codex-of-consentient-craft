/**
 * PURPOSE: Proxy for agent-prompt-get-broker that wires the quest-find + quest-load mock chain
 *
 * USAGE:
 * const proxy = agentPromptGetBrokerProxy();
 * proxy.setupQuestFound({ quest });
 */

import { pathJoinAdapterProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const agentPromptGetBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupDevServerConfig: (params: {
    config: ReturnType<ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['makeRealConfig']>;
  }) => void;
  setupDevServer: (params: { devCommand: string; port: number }) => void;
  getDevServerConfigStartPath: () => ReturnType<
    ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['getResolvedStartPath']
  >;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  // Recovery I/O the broker performs for flowrider/siegemaster (dev-server config read). Existing
  // role tests (codeweaver/minion) never hit this branch, so the default (no config resolved)
  // suffices; the semantic methods below let dev-server tests stage the resolved config.
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  processCwdAdapterProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      // pathJoin: questPath + quest.json
      pathJoinProxy.returns({ result: questFilePath });

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
    },

    // Stage the resolved .dungeonmaster.json for the flowrider/siegemaster dev-server branch.
    setupDevServerConfig: ({
      config,
    }: {
      config: ReturnType<
        ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['makeRealConfig']
      >;
    }): void => {
      configProxy.setupConfigResolved({ config });
    },

    // Stage a resolved config carrying a devServer block from raw command + port. Builds the
    // config via the config stub internally so siege dev-server tests don't construct contracts.
    setupDevServer: ({ devCommand, port }: { devCommand: string; port: number }): void => {
      const config = configProxy.makeConfigWithArgs({ devServer: { devCommand, port } } as never);
      configProxy.setupConfigResolved({ config });
    },

    // Capture the startPath the broker handed to dungeonmasterConfigResolveAdapter on the
    // flowrider/siegemaster branch — the regression guard asserts it resolves to a file (not the
    // bare cwd directory, whose dirname() walks above the repo root and misses
    // .dungeonmaster.json).
    getDevServerConfigStartPath: (): ReturnType<typeof configProxy.getResolvedStartPath> =>
      configProxy.getResolvedStartPath(),
  };
};
