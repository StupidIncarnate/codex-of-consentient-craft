import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import { laneKillBrokerProxy } from '../../lane/kill/lane-kill-broker.proxy';
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
  getPersistedQuests: () => readonly unknown[];
  // Stages the lane's `kill` call for an `outcome` record on a `needsLane` item. Not called by a
  // test whose work item is not `needsLane` — the broker never reaches the dynamic import at all
  // in that case, so nothing needs to be staged for it.
  setupLaneKill: () => void;
  getKilledInstanceIds: () => readonly unknown[];
} => {
  questFindQuestPathBrokerProxy();
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const joinHandle: MockHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();
  // Both layer proxies mock the SAME underlying `questPersistBroker` function — `registerMock`
  // state is shared per function across every proxy mocking it, so either one's own
  // `getPersistedQuests()` already sees every persist call regardless of which layer made it.
  // Constructing both keeps `enforce-proxy-child-creation` satisfied for each layer this parent
  // can dispatch to; only the first's accessor is read from below.
  const patchProxy = workItemPatchLayerBrokerProxy();
  const invalidationProxy = invalidationApplyLayerBrokerProxy();
  const killProxy = laneKillBrokerProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

      findQuestPathMock
        .calledWith([{ questId: quest.id }])
        .resolves({ questPath: questFolderPath, guildId });

      // questWorkRecordBroker's own join(questPath, quest.json) -> questFilePath, addressed by the
      // exact tuple rather than an address-less FIFO slot, so it can never answer a different
      // broker's join call sharing the same underlying mocked `join`.
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      patchProxy.setupPersistSucceeds({ questFilePath });
      invalidationProxy.setupPersistSucceeds({ questFilePath });
    },

    queueNextQuestRead: ({ quest }: { quest: Quest }): void => {
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
    },

    getPersistedQuests: (): readonly unknown[] => patchProxy.getPersistedQuests(),

    setupLaneKill: (): void => {
      killProxy.setupStopped({ stopped: true });
    },

    getKilledInstanceIds: (): readonly unknown[] => killProxy.getKilledInstanceIds(),
  };
};
