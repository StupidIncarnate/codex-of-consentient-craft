import type { DirEntrySync } from '#gateway/node/fs';
import { filePathContract, questContract } from '@dungeonmaster/shared/contracts';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { FileName, FilePath, GuildConfig, QuestSource, Guild } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

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
      questDirEntries: DirEntrySync[];
    }[];
  }) => void;
  setupQuestsPath: (params: { homeDir: string; homePath: FilePath; questsPath: FilePath }) => void;
  setupQuestDirectoryListing: (params: { files: readonly never[] }) => void;
  setupQuestFolderListing: (params: { files: readonly FileName[] }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
  getRmCallArgs: () => readonly unknown[][];
  setupSucceeds: (params: { questSource: QuestSource }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => RecordedCalls;
} => {
  const ensureGuild = smoketestEnsureGuildBrokerProxy();
  const list = questListBrokerProxy();
  // Every quest this proxy stages (via setupQuestFile below) gets its OWN real delete-path stage
  // through this same instance — the test knows every quest it seeds, so there is no need to
  // guess which ones questSource will match at run time (see setupQuestFile).
  const deleteProxy = questDeleteBrokerProxy();

  const homePathRef: { value: FilePath } = { value: filePathContract.parse('/unset') };
  const guildIdRef: { value: Guild['id'] } = { value: GuildIdStub() };

  const mocked = registerMock({ fn: smoketestClearPriorQuestsBroker });

  return {
    setupSucceeds: ({ questSource }: { questSource: QuestSource }): void => {
      mocked
        .calledWith([{ questSource }])
        .resolves({ deletedCount: 0 });
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        smoketestClearPriorQuestsBroker: typeof smoketestClearPriorQuestsBroker;
      }>({
        module: './smoketest-clear-prior-quests-broker',
      });
      // Any `{ questSource }` call: the real run is opt-in, and the test's own quest source is the
      // one thing the scenarios seeded below never name.
      const isClearCall = (call: unknown): boolean =>
        typeof call === 'object' && call !== null && 'questSource' in call;
      mocked.calledWith([isClearCall]).implement(realMod.smoketestClearPriorQuestsBroker);
      // Cascading passthrough: smoketestClearPriorQuestsBroker calls smoketestEnsureGuildBroker
      // internally, which is also module-mocked. The downstream test still primes the guild list
      // chain via setupSmoketestGuildPresent, so ensure-guild must run real here too.
      ensureGuild.setupPassthrough();
    },
    getCallArgs: (): RecordedCalls => mocked.callsMatching([]),
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
        questDirEntries: DirEntrySync[];
      }[];
    }): void => {
      homePathRef.value = homePath;
      const [guild] = config.guilds;
      if (guild) {
        guildIdRef.value = guild.id;
      }
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

    // Which quests actually get deleted is decided by questSource filtering inside
    // smoketestClearPriorQuestsBroker's real run, but every quest this test seeds is known HERE,
    // at setup time — so each one gets its own real questDeleteBrokerProxy.setupQuestFolderPath
    // stage (the exact 5-segment join tuple the real delete call uses), keyed on its own questId.
    // Staging every seeded quest is harmless: only the questSource-matched one(s) ever have their
    // rm call read back.
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      list.setupQuestFile({ questJson });

      const quest = questContract.parse(JSON.parse(questJson));
      const questFolderPath = filePathContract.parse(
        `${homePathRef.value}/${dungeonmasterHomeStatics.paths.guildsDir}/${guildIdRef.value}/${dungeonmasterHomeStatics.paths.questsDir}/${quest.id}`,
      );

      deleteProxy.setupQuestFolderPath({
        homePath: homePathRef.value,
        guildId: guildIdRef.value,
        questId: quest.id,
        questFolderPath,
      });
    },

    getRmCallArgs: (): readonly unknown[][] => deleteProxy.getAllRmCallArgs(),
  };
};
