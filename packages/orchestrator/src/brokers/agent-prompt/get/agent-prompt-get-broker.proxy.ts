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
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

// The broker builds startPath as pathJoinAdapter([processCwdAdapter(), projectConfigFile]).
// pathJoinAdapterProxy() defaults to a real '/'-join and processCwdAdapterProxy() defaults to
// '/default/cwd' (both from @dungeonmaster/shared/testing), so this is the exact, real address
// dungeonmasterConfigResolveAdapter is called with on the flowrider/siegemaster branch.
const DEV_SERVER_CONFIG_START_PATH = FilePathStub({
  value: `/default/cwd/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
});

export const agentPromptGetBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupDevServerConfig: (params: {
    config: ReturnType<ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['makeRealConfig']>;
  }) => void;
  setupDevServer: (params: { devCommand: string; port: number }) => void;
  setupNoDevServerConfig: () => void;
  getDevServerConfigStartPath: () => ReturnType<
    ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['getResolvedStartPath']
  >;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  // Recovery I/O the broker performs for flowrider/siegemaster (dev-server config read). Existing
  // role tests (codeweaver/minion) never hit this branch, so it is never called for them; the
  // semantic methods below let dev-server tests stage the resolved config for the branch that
  // DOES call it.
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
      configProxy.setupConfigResolved({ startPath: DEV_SERVER_CONFIG_START_PATH, config });
    },

    // Stage a resolved config carrying a devServer block from raw command + port. Builds the
    // config via the config stub internally so siege dev-server tests don't construct contracts.
    setupDevServer: ({ devCommand, port }: { devCommand: string; port: number }): void => {
      const config = configProxy.makeConfigWithArgs({ devServer: { devCommand, port } } as never);
      configProxy.setupConfigResolved({ startPath: DEV_SERVER_CONFIG_START_PATH, config });
    },

    // Stage the siegemaster branch resolving a config with NO devServer block —
    // the real DungeonmasterConfigStub() default (devServer is `.optional()`, no default),
    // matching a repo that has a .dungeonmaster.json but no devServer configured.
    setupNoDevServerConfig: (): void => {
      configProxy.setupConfigResolved({
        startPath: DEV_SERVER_CONFIG_START_PATH,
        config: configProxy.makeRealConfig(),
      });
    },

    // Capture the startPath the broker handed to dungeonmasterConfigResolveAdapter on the
    // flowrider/siegemaster branch — the regression guard asserts it resolves to a file (not the
    // bare cwd directory, whose dirname() walks above the repo root and misses
    // .dungeonmaster.json).
    getDevServerConfigStartPath: (): ReturnType<typeof configProxy.getResolvedStartPath> =>
      configProxy.getResolvedStartPath(),
  };
};
