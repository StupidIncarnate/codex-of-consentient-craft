import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';
import { invalidationApplyLayerBrokerProxy } from './invalidation-apply-layer-broker.proxy';
import { workItemPatchLayerBrokerProxy } from './work-item-patch-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

const FIXED_TIMESTAMP = '2026-01-15T10:00:00.000Z';

export const questWorkRecordBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  // Queues one MORE fs read behind the one `setupQuestFound` already queued —
  // `questLoadBrokerProxy.setupQuestFile` is a FIFO queue, so the concurrency test uses this to
  // give a second, later `questWorkRecordBroker` call a DIFFERENT starting snapshot than the
  // first — the shape a lock-serialized second read of a just-written file actually has.
  queueNextQuestRead: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getPersistedQuests: () => readonly unknown[];
} => {
  questFindQuestPathBrokerProxy();
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();
  // Both layer proxies mock the SAME underlying `questPersistBroker` function — `registerMock`
  // state is shared per function across every proxy mocking it, so either one's own
  // `getPersistedQuests()` already sees every persist call regardless of which layer made it.
  // Constructing both keeps `enforce-proxy-child-creation` satisfied for each layer this parent
  // can dispatch to; only the first's accessor is read from below.
  const patchProxy = workItemPatchLayerBrokerProxy();
  invalidationApplyLayerBrokerProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathMock
        .calledWith([{ questId: quest.id }])
        .resolves({ questPath: questFolderPath, guildId });

      pathJoinProxy.returns({ result: questFilePath });

      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
    },

    queueNextQuestRead: ({ quest }: { quest: Quest }): void => {
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
    },

    setupQuestNotFound: (): void => {
      findQuestPathMock.calledWith([]).rejects(new QuestNotFoundError({ questId: 'unknown' }));
    },

    getPersistedQuests: (): readonly unknown[] => patchProxy.getPersistedQuests(),
  };
};
