import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath, FileName, GuildId, QuestStub } from '@dungeonmaster/shared/contracts';
import {
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questResolveQuestsPathBrokerProxy } from '../resolve-quests-path/quest-resolve-quests-path-broker.proxy';
import { questListBroker } from './quest-list-broker';

registerModuleMock({ module: './quest-list-broker' });

type Quest = ReturnType<typeof QuestStub>;

export const questListBrokerProxy = (): {
  setupQuestsPath: (params: { homeDir: string; homePath: FilePath; questsPath: FilePath }) => void;
  setupQuestDirectories: (params: { files: FileName[] }) => void;
  setupQuestDirectoriesFailure: (params: { error: Error }) => void;
  setupQuestFilePath: (params: { result: FilePath }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
  setupDirectList: (params: { guildId: GuildId; quests: readonly Quest[] }) => void;
  setupDirectListFailure: (params: { error: Error }) => void;
  getSkipReports: () => readonly unknown[];
} => {
  const resolveQuestsPathProxy = questResolveQuestsPathBrokerProxy();
  const fsReaddirProxy = fsReaddirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const questLoadProxy = questLoadBrokerProxy();
  // The broker reports every skipped quest file on stderr. Capture it so test output stays
  // clean and tests can assert on `process.stderr.write` that a skip is never silent.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.mockImplementation(() => true);

  const mocked = questListBroker as jest.MockedFunction<typeof questListBroker>;
  // Default: passthrough so existing consumers driving the fs chain keep working.
  const realMod = requireActual<{ questListBroker: typeof questListBroker }>({
    module: './quest-list-broker',
  });
  mocked.mockImplementation(realMod.questListBroker);

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
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir,
        homePath,
        questsPath,
      });
    },
    setupQuestDirectories: ({ files }: { files: FileName[] }): void => {
      fsReaddirProxy.returns({ files });
    },
    setupQuestDirectoriesFailure: ({ error }: { error: Error }): void => {
      fsReaddirProxy.throws({ error });
    },
    setupQuestFilePath: ({ result }: { result: FilePath }): void => {
      pathJoinProxy.returns({ result });
    },
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      questLoadProxy.setupQuestFile({ questJson });
    },
    setupDirectList: ({
      guildId: _guildId,
      quests,
    }: {
      guildId: GuildId;
      quests: readonly Quest[];
    }): void => {
      mocked.mockResolvedValueOnce(quests as Quest[]);
    },
    setupDirectListFailure: ({ error }: { error: Error }): void => {
      mocked.mockRejectedValueOnce(error);
    },
    // Only the broker's own skip lines, in write order — so a test can assert HOW MANY times an
    // unchanged bad file was reported across repeated list calls, not just that it was reported.
    getSkipReports: (): readonly unknown[] =>
      stderrSpy.mock.calls
        .map((call) => call[0])
        .filter((line) => String(line).startsWith('[quest-list] skipping unloadable quest')),
  };
};
