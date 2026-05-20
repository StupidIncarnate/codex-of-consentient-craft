import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath, WorkItem } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questCreateBroker } from '../create/quest-create-broker';
import { questCreateBrokerProxy } from '../create/quest-create-broker.proxy';

registerModuleMock({ module: '../create/quest-create-broker' });

const DEFAULT_QUEST_FILE_PATH = FilePathStub({
  value: '/home/testuser/.dungeonmaster/guilds/test-guild/quests/default/quest.json',
});
const DEFAULT_QUEST_FOLDER_PATH = FilePathStub({
  value: '/home/testuser/.dungeonmaster/guilds/test-guild/quests/default',
});

export const questUserAddBrokerProxy = (): {
  setupQuestCreation: (params: { questFilePath: FilePath; questFolderPath: FilePath }) => void;
  setupCreateFailure: (params: { error: Error }) => void;
  getLastInitialWorkItems: () => readonly WorkItem[];
} => {
  questCreateBrokerProxy();

  const createMock = questCreateBroker as jest.MockedFunction<typeof questCreateBroker>;

  createMock.mockResolvedValue({
    questFilePath: DEFAULT_QUEST_FILE_PATH,
    questFolderPath: DEFAULT_QUEST_FOLDER_PATH,
  });

  return {
    setupQuestCreation: ({
      questFilePath,
      questFolderPath,
    }: {
      questFilePath: FilePath;
      questFolderPath: FilePath;
    }): void => {
      createMock.mockResolvedValueOnce({ questFilePath, questFolderPath });
    },
    setupCreateFailure: ({ error }: { error: Error }): void => {
      createMock.mockRejectedValueOnce(error);
    },
    getLastInitialWorkItems: (): readonly WorkItem[] => {
      const { calls } = createMock.mock;
      const lastCall = calls[calls.length - 1];
      return lastCall?.[0]?.initialWorkItems ?? [];
    },
  };
};
