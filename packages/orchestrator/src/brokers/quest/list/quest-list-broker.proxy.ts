import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { join } from '#gateway/node/path';

import {
  filePathContract,
  type FilePath,
  type FileName,
  type GuildId,
  type QuestStub,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questResolveQuestsPathBrokerProxy } from '../resolve-quests-path/quest-resolve-quests-path-broker.proxy';
import { questListBroker } from './quest-list-broker';

registerModuleMock({ module: './quest-list-broker' });

type Quest = ReturnType<typeof QuestStub>;

export const questListBrokerProxy = (): {
  setupQuestsPath: (params: { homeDir: string; homePath: FilePath; questsPath: FilePath }) => void;
  setupQuestDirectories: (params: { files: FileName[] }) => void;
  setupQuestDirectoriesFailure: (params: { error: Error }) => void;
  setupQuestFilePath: (params: { folderName: FileName; result: FilePath }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
  setupDirectList: (params: { guildId: GuildId; quests: readonly Quest[] }) => void;
  setupDirectListOnce: (params: { guildId: GuildId; quests: readonly Quest[] }) => void;
  setupDirectListFailure: (params: { error: Error }) => void;
  getSkipReports: () => readonly unknown[];
} => {
  const resolveQuestsPathProxy = questResolveQuestsPathBrokerProxy();
  const readdirProxy = readdirSyncProxy();
  const joinHandle = registerMock({ fn: join });
  const questLoadProxy = questLoadBrokerProxy();
  // The broker reports every skipped quest file on stderr. Capture it so test output stays
  // clean and tests can assert on the recorded writes that a skip is never silent.
  const stderrChild = stderrProxy();

  const mocked = registerMock({ fn: questListBroker });
  // Default: passthrough so existing consumers driving the fs chain keep working. `guildId`
  // varies per call and the real implementation handles any guildId correctly using the args
  // it actually receives, so `[]` is the honest address for this generic fallback.
  const realMod = requireActual<{ questListBroker: typeof questListBroker }>({
    module: './quest-list-broker',
  });
  mocked.calledWith([]).implement(realMod.questListBroker as never);

  // setupQuestsPath is always called immediately before setupQuestDirectories* in every caller —
  // captured here so the readdir mock can be addressed by the SAME questsPath the broker will
  // actually list, instead of guessing at a directory the test never described.
  const questsPathRef = { value: filePathContract.parse('/quest-list-broker-proxy/unset') };

  return {
    setupQuestsPath: ({
      homeDir,
      homePath,
      questsPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      questsPath: FilePath;
    }): void => {
      questsPathRef.value = questsPath;
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir,
        homePath,
        questsPath,
      });
    },
    setupQuestDirectories: ({ files }: { files: FileName[] }): void => {
      readdirProxy.returns({ path: String(questsPathRef.value), names: files });
    },
    setupQuestDirectoriesFailure: ({ error }: { error: Error }): void => {
      readdirProxy.throws({ path: String(questsPathRef.value), error });
    },
    setupQuestFilePath: ({
      folderName,
      result,
    }: {
      folderName: FileName;
      result: FilePath;
    }): void => {
      // questListBroker's own per-folder join(questsPath, folderName, quest.json) -> result,
      // addressed by the exact tuple rather than an address-less FIFO slot, so a second folder's
      // join call in the same test can never answer this one.
      joinHandle
        .calledWith([questsPathRef.value, folderName, locationsStatics.quest.questFile])
        .returns(result);
    },
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      questLoadProxy.setupQuestFile({ questJson });
    },
    // Every real caller of this proxy loops over multiple guilds, staging one setupDirectList
    // per guildId — keying on guildId is what makes each guild get back ITS OWN quest list
    // regardless of what order questListBroker is actually invoked in (a queue would silently
    // hand guild A's quests to guild B if the real iteration order ever differed from staging
    // order).
    setupDirectList: ({
      guildId,
      quests,
    }: {
      guildId: GuildId;
      quests: readonly Quest[];
    }): void => {
      mocked.calledWith([{ guildId }]).resolves(quests as Quest[]);
    },
    // Same address as setupDirectList, but consumed by ONE call. Reach for this when a test
    // stages two DIFFERENT listings for the SAME guildId across successive calls — the sticky
    // form registers both at equal specificity, where the later one answers every call including
    // the first, so listing #2 would silently replace listing #1 before it was ever read.
    setupDirectListOnce: ({
      guildId,
      quests,
    }: {
      guildId: GuildId;
      quests: readonly Quest[];
    }): void => {
      mocked.onceFor([{ guildId }]).resolves(quests as Quest[]);
    },
    // No caller currently exercises this path with a specific guildId, so there is nothing to
    // key on — `[]` describes that honestly.
    setupDirectListFailure: ({ error }: { error: Error }): void => {
      mocked.onceFor([]).rejects(error);
    },
    // Only the broker's own skip lines, in write order — so a test can assert HOW MANY times an
    // unchanged bad file was reported across repeated list calls, not just that it was reported.
    getSkipReports: (): readonly unknown[] =>
      stderrChild
        .getWrites()
        .filter((line) => String(line).startsWith('[quest-list] skipping unloadable quest')),
  };
};
