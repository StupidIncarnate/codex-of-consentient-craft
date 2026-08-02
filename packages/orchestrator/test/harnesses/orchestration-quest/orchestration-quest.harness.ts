/**
 * PURPOSE: Quest lifecycle helpers for orchestration integration tests — creating a guild + quest
 * and seeding a quest directly to `in_progress` with an operations ledger + linked work items
 *
 * USAGE:
 * const quest = orchestrationQuestHarness();
 * const { guild, questId } = await quest.createGuildAndQuest({ testbed });
 * await quest.seedInProgressRelay({ questId, operations, workItems });
 */
import type {
  GuildId,
  QuestId,
  FlowStub,
  OperationItemStub,
  QuestCommentStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import {
  GuildNameStub,
  GuildPathStub,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { GuildAddResponder } from '../../../src/responders/guild/add/guild-add-responder';
import { GuildRemoveResponder } from '../../../src/responders/guild/remove/guild-remove-responder';
import { QuestUserAddResponder } from '../../../src/responders/quest/user-add/quest-user-add-responder';
import { questFindQuestPathBroker } from '../../../src/brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../src/brokers/quest/load/quest-load-broker';
import { questPersistBroker } from '../../../src/brokers/quest/persist/quest-persist-broker';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

type OperationItem = ReturnType<typeof OperationItemStub>;
type WorkItem = ReturnType<typeof WorkItemStub>;
type Flow = ReturnType<typeof FlowStub>;
type QuestComment = ReturnType<typeof QuestCommentStub>;
type Quest = ReturnType<typeof QuestStub>;

export const orchestrationQuestHarness = (): {
  afterEach: () => Promise<void>;
  createGuildAndQuest: (params: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    title?: string;
    userRequest?: string;
  }) => Promise<{
    guild: Awaited<ReturnType<typeof GuildAddResponder>>;
    questId: QuestId;
  }>;
  seedInProgressRelay: (params: {
    questId: QuestId;
    operations: readonly OperationItem[];
    workItems: readonly WorkItem[];
  }) => Promise<void>;
  // Overwrites flows/workItems/comments directly on disk, leaving every other field (status,
  // title, etc.) as QuestUserAddResponder set it. Bypasses QuestModifyResponder the same way
  // seedInProgressRelay does — the per-status input allowlist is covered by the broker/
  // responder unit tests, not by this fixture-building helper.
  seedFlowsAndComments: (params: {
    questId: QuestId;
    flows: readonly Flow[];
    workItems: readonly WorkItem[];
    comments: readonly QuestComment[];
  }) => Promise<void>;
  // Reads the quest back off real disk — for asserting what a prior seed or a real broker
  // call actually persisted.
  reload: (params: { questId: QuestId }) => Promise<Quest>;
  removeGuild: (params: { guildId: GuildId }) => Promise<void>;
} => {
  const createdGuildIds: GuildId[] = [];

  // Seeds a quest directly to `in_progress` with the supplied operations ledger + linked work
  // items by writing the quest JSON to disk. It bypasses QuestModifyResponder so the lifecycle
  // validators (per-status input allowlist, transition checks) are not exercised here — those are
  // covered by the broker/responder unit tests. This mirrors a quest whose Start Quest transition
  // already seeded the relay.
  const seedInProgressRelay = async ({
    questId,
    operations,
    workItems,
  }: {
    questId: QuestId;
    operations: readonly OperationItem[];
    workItems: readonly WorkItem[];
  }): Promise<void> => {
    const { questPath } = await questFindQuestPathBroker({ questId });
    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );
    const loadedQuest = await questLoadBroker({ questFilePath });

    const seededQuest = {
      ...loadedQuest,
      status: 'in_progress' as typeof loadedQuest.status,
      operations: [...operations],
      workItems: [...workItems],
      updatedAt: new Date().toISOString() as typeof loadedQuest.updatedAt,
    };

    const questJson = fileContentsContract.parse(
      JSON.stringify(seededQuest, null, JSON_INDENT_SPACES),
    );
    await questPersistBroker({ questFilePath, contents: questJson, questId });
  };

  const loadByQuestId = async (params: { questId: QuestId }): Promise<Quest> => {
    const { questId } = params;
    const { questPath } = await questFindQuestPathBroker({ questId });
    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );
    return questLoadBroker({ questFilePath });
  };

  return {
    afterEach: async (): Promise<void> => {
      const idsToRemove = [...createdGuildIds];
      createdGuildIds.length = 0;
      await Promise.all(
        idsToRemove.map(async (guildId) => {
          try {
            await GuildRemoveResponder({ guildId });
          } catch {
            // Guild config may be unavailable if the test environment was already cleaned up.
          }
        }),
      );
    },
    createGuildAndQuest: async ({
      testbed,
      title = 'Integration Test Quest',
      userRequest = 'An integration test quest',
    }: {
      testbed: ReturnType<typeof installTestbedCreateBroker>;
      title?: string;
      userRequest?: string;
    }) => {
      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Integ Test Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      createdGuildIds.push(guild.id);

      const addResult = await QuestUserAddResponder({
        title,
        userRequest,
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      return { guild, questId };
    },
    seedInProgressRelay,
    seedFlowsAndComments: async ({
      questId,
      flows,
      workItems,
      comments,
    }: {
      questId: QuestId;
      flows: readonly Flow[];
      workItems: readonly WorkItem[];
      comments: readonly QuestComment[];
    }): Promise<void> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
      );
      const loadedQuest = await questLoadBroker({ questFilePath });

      const seededQuest = {
        ...loadedQuest,
        flows: [...flows],
        workItems: [...workItems],
        comments: [...comments],
      };

      const questJson = fileContentsContract.parse(
        JSON.stringify(seededQuest, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents: questJson, questId });
    },
    reload: loadByQuestId,
    removeGuild: async ({ guildId }: { guildId: GuildId }): Promise<void> => {
      await GuildRemoveResponder({ guildId });
    },
  };
};
