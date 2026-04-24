import type { FileName, FilePath, GuildConfig } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { DeletedCountStub } from '../../../contracts/deleted-count/deleted-count.stub';
import { questDeleteBrokerProxy } from '../../quest/delete/quest-delete-broker.proxy';
import { questListBrokerProxy } from '../../quest/list/quest-list-broker.proxy';
import { smoketestEnsureGuildBrokerProxy } from '../ensure-guild/smoketest-ensure-guild-broker.proxy';
import { smoketestClearPriorQuestsBroker } from './smoketest-clear-prior-quests-broker';

registerModuleMock({ module: './smoketest-clear-prior-quests-broker' });

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
  setupSucceeds: () => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const ensureGuild = smoketestEnsureGuildBrokerProxy();
  const list = questListBrokerProxy();
  const deleteBroker = questDeleteBrokerProxy();

  const mocked = smoketestClearPriorQuestsBroker as jest.MockedFunction<
    typeof smoketestClearPriorQuestsBroker
  >;
  const noopResult = { deletedCount: DeletedCountStub({ value: 0 }) };
  mocked.mockResolvedValue(noopResult);

  return {
    setupSucceeds: (): void => {
      mocked.mockResolvedValueOnce(noopResult);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual({ module: './smoketest-clear-prior-quests-broker' });
      const realImpl = Reflect.get(
        realMod as object,
        'smoketestClearPriorQuestsBroker',
      ) as typeof smoketestClearPriorQuestsBroker;
      mocked.mockImplementation(realImpl);
      // Cascading passthrough: smoketestClearPriorQuestsBroker calls smoketestEnsureGuildBroker
      // internally, which is also module-mocked. The downstream test still primes the guild list
      // chain via setupSmoketestGuildPresent, so ensure-guild must run real here too.
      ensureGuild.setupPassthrough();
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
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
