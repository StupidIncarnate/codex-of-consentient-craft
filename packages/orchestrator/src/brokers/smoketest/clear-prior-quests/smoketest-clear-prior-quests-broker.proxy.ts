import { appendFile, rm } from 'fs/promises';
import type { FileName, FilePath, GuildConfig, QuestSource } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

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
  setupSucceeds: (params: { questSource: QuestSource }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const ensureGuild = smoketestEnsureGuildBrokerProxy();
  const list = questListBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; questDeleteBroker's own real chain runs
  // through the direct rm/appendFile staging below instead of this child's setupQuestFolderPath
  // (see the comment there for why a per-questId address isn't available to this proxy).
  questDeleteBrokerProxy();

  // Which quests actually get deleted is decided by questSource filtering inside
  // smoketestClearPriorQuestsBroker's real run — this proxy only knows the FULL quest list
  // (via setupQuestFile below), not which subset will match, so it has no per-questId
  // questFolderPath to hand questDeleteBrokerProxy.setupQuestFolderPath ahead of time. Key on
  // the real path SHAPE each call carries instead: a quest deletion always sits under a
  // `/quests/` directory, and the outbox append always targets the fixed outbox filename.
  const rmMock = registerMock({ fn: rm });
  rmMock
    .calledWith([(filePath: unknown) => String(filePath).includes('/quests/')])
    .resolves(undefined);

  const appendMock = registerMock({ fn: appendFile });
  appendMock
    .calledWith([(filePath: unknown) => String(filePath).endsWith('event-outbox.jsonl')])
    .resolves({ success: true as const });

  const mocked = registerMock({ fn: smoketestClearPriorQuestsBroker });

  return {
    setupSucceeds: ({ questSource }: { questSource: QuestSource }): void => {
      mocked
        .calledWith([{ questSource }])
        .resolves({ deletedCount: DeletedCountStub({ value: 0 }) });
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        smoketestClearPriorQuestsBroker: typeof smoketestClearPriorQuestsBroker;
      }>({
        module: './smoketest-clear-prior-quests-broker',
      });
      mocked.calledWith([]).implement(realMod.smoketestClearPriorQuestsBroker);
      // Cascading passthrough: smoketestClearPriorQuestsBroker calls smoketestEnsureGuildBroker
      // internally, which is also module-mocked. The downstream test still primes the guild list
      // chain via setupSmoketestGuildPresent, so ensure-guild must run real here too.
      ensureGuild.setupPassthrough();
    },
    getCallArgs: (): readonly unknown[][] => mocked.callsMatching([]),
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

    // deleteBroker.getRmCallArgs() filters by a questFolderPath this proxy never addresses
    // (see the comment above questDeleteBrokerProxy() for why); read straight off rmMock,
    // which every real questDeleteBroker call in this test actually dispatches through.
    getRmCallArgs: (): readonly unknown[][] => rmMock.callsMatching([]),
  };
};
