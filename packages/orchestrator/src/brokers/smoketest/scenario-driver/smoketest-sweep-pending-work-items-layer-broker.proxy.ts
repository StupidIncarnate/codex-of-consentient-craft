import { questContract } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import type { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { smoketestSignOutstandingUnitsBrokerProxy } from '../sign-outstanding-units/smoketest-sign-outstanding-units-broker.proxy';
import { smoketestStampOverrideBrokerProxy } from '../stamp-override/smoketest-stamp-override-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type PromptText = ReturnType<typeof PromptTextStub>;
type FilePathValue = ReturnType<typeof FilePathStub>;

// smoketestSweepPendingWorkItemsLayerBroker's own join(questPath, quest.json) shares the exact
// tuple stampProxy.setupQuestFound already stages for its OWN internal join — one home for both,
// since GuildIdStub()'s fixed default makes every setupQuestFound call compute the same folder.
const questFolderPathFor = ({ quest }: { quest: Quest }): FilePathValue =>
  FilePathStub({
    value: `/home/testuser/.dungeonmaster/guilds/${GuildIdStub()}/quests/${quest.folder}`,
  });

export const smoketestSweepPendingWorkItemsLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => { questFolderPath: FilePathValue };
  setupQuestNotFound: (params: { questId: string }) => void;
  getAllPersistedContents: () => readonly unknown[];
  // The persisted bytes parsed back into overrides, so a test can assert the RESOLVED prompt text
  // without importing the quest contract itself.
  getStampedOverrides: () => readonly (PromptText | undefined)[];
  // Every quest the sweep's own writes produced, parsed. Both the sign-off write and the stamp go
  // through questPersistBroker, so this is the one place a test reads either back.
  getPersistedQuests: () => readonly Quest[];
  getQuestFileJoinArgs: (params: {
    questFolderPath: FilePathValue;
  }) => readonly unknown[] | undefined;
} => {
  // Register child proxies for every implementation import even though the stampProxy already
  // registers its own nested chain — the enforce-proxy-child-creation rule requires each direct
  // implementation import to have a matching proxy import at this layer.
  questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  const signProxy = smoketestSignOutstandingUnitsBrokerProxy();
  const stampProxy = smoketestStampOverrideBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): { questFolderPath: FilePathValue } => {
      // Three quest LOADS happen per stamped work item: the sweep's own, the sign broker's, and the
      // stamp broker's. questLoadBrokerProxy queues one read per call, so all three need seeding —
      // an unconsumed queue entry is inert, a missing one throws.
      stampProxy.setupQuestFound({ quest });
      stampProxy.setupQuestFound({ quest });
      stampProxy.setupQuestFound({ quest });
      return { questFolderPath: questFolderPathFor({ quest }) };
    },
    setupQuestNotFound: ({ questId }: { questId: string }): void => {
      stampProxy.setupQuestNotFound({ questId });
    },
    getAllPersistedContents: (): readonly unknown[] => stampProxy.getAllPersistedContents(),
    getStampedOverrides: (): readonly (PromptText | undefined)[] =>
      stampProxy
        .getAllPersistedContents()
        .map((content) => questContract.parse(JSON.parse(String(content))))
        .flatMap((persisted) => persisted.workItems.map((wi) => wi.smoketestPromptOverride)),
    getPersistedQuests: (): readonly Quest[] => signProxy.getPersistedQuests(),
    getQuestFileJoinArgs: ({
      questFolderPath,
    }: {
      questFolderPath: FilePathValue;
    }): readonly unknown[] | undefined => joinHandle.callsMatching([questFolderPath]).at(-1),
  };
};
