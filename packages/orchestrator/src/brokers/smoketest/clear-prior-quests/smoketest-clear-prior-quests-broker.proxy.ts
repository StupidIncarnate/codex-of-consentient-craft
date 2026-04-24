import type { FileName, FilePath, GuildConfig } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';

import { questDeleteBrokerProxy } from '../../quest/delete/quest-delete-broker.proxy';
import { questListBrokerProxy } from '../../quest/list/quest-list-broker.proxy';
import { smoketestEnsureGuildBrokerProxy } from '../ensure-guild/smoketest-ensure-guild-broker.proxy';

export const smoketestClearPriorQuestsBrokerProxy = (): {
  setupSmoketestGuildPresent: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildEntries: readonly {
      accessible: boolean;
      questsDirPath: FilePath;
      questDirEntries: Dirent[];
    }[];
  }) => void;
  setupQuestsPath: (params: { homeDir: string; homePath: FilePath; questsPath: FilePath }) => void;
  setupQuestDirectoryListing: (params: { files: readonly never[] }) => void;
  setupQuestFolderListing: (params: { files: readonly FileName[] }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
  getRmCallArgs: () => readonly unknown[][];
} => {
  const ensureGuild = smoketestEnsureGuildBrokerProxy();
  const list = questListBrokerProxy();
  const deleteBroker = questDeleteBrokerProxy();

  return {
    setupSmoketestGuildPresent: ({
      config,
      homeDir,
      homePath,
      guildEntries,
    }: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: readonly {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      ensureGuild.setupGuildPresent({ config, homeDir, homePath, guildEntries });
    },

    setupQuestsPath: ({
      homeDir,
      homePath,
      questsPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      questsPath: FilePath;
    }): void => {
      list.setupQuestsPath({ homeDir, homePath, questsPath });
    },

    setupQuestDirectoryListing: ({ files: _files }: { files: readonly never[] }): void => {
      list.setupQuestDirectories({ files: [] });
    },

    setupQuestFolderListing: ({ files }: { files: readonly FileName[] }): void => {
      list.setupQuestDirectories({ files: files.slice() });
    },

    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      list.setupQuestFile({ questJson });
    },

    getRmCallArgs: (): readonly unknown[][] => deleteBroker.getRmCallArgs(),
  };
};
