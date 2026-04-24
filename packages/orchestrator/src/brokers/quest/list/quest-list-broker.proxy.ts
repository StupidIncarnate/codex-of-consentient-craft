import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath, FileName, GuildId, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

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
} => {
  const resolveQuestsPathProxy = questResolveQuestsPathBrokerProxy();
  const fsReaddirProxy = fsReaddirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const questLoadProxy = questLoadBrokerProxy();

  const mocked = questListBroker as jest.MockedFunction<typeof questListBroker>;
  // Default: passthrough so existing consumers driving the fs chain keep working.
  const realMod = requireActual({ module: './quest-list-broker' });
  const realImpl = Reflect.get(realMod as object, 'questListBroker') as typeof questListBroker;
  mocked.mockImplementation(realImpl);

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
  };
};
