import { join } from '#gateway/node/path';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { OperationItemIdStub } from '@dungeonmaster/shared/contracts/operation-item-id/operation-item-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import { plannedWorkWriteBrokerProxy } from '../../planned-work/write/planned-work-write-broker.proxy';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type OperationItemId = ReturnType<typeof OperationItemIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

const FIXED_TIMESTAMP = '2026-01-15T10:00:00.000Z';

export const questWorkPlanWriteBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest; writesOperationItemId?: OperationItemId }) => {
    questFolderPath: AbsoluteFilePath;
  };
  setupQuestNotFound: () => void;
  getWrittenPlan: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => unknown;
  getQuestFileJoinArgs: (params: {
    questFolderPath: AbsoluteFilePath;
  }) => readonly unknown[] | undefined;
} => {
  questFindQuestPathBrokerProxy();
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const joinHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();
  const writeProxy = plannedWorkWriteBrokerProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    setupQuestFound: ({
      quest,
      writesOperationItemId,
    }: {
      quest: Quest;
      writesOperationItemId?: OperationItemId;
    }): { questFolderPath: AbsoluteFilePath } => {
      const guildId = GuildIdStub();
      const questFolderPath = AbsoluteFilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathMock
        .calledWith([{ questId: quest.id }])
        .resolves({ questPath: questFolderPath, guildId });

      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      if (writesOperationItemId !== undefined) {
        writeProxy.setupWriteSucceeds({ questFolderPath, operationItemId: writesOperationItemId });
      }

      return { questFolderPath };
    },

    setupQuestNotFound: (): void => {
      findQuestPathMock.calledWith([]).rejects(new QuestNotFoundError({ questId: 'unknown' }));
    },

    getWrittenPlan: ({
      questFolderPath,
      operationItemId,
    }: {
      questFolderPath: AbsoluteFilePath;
      operationItemId: OperationItemId;
    }): unknown => writeProxy.getWrittenContent({ questFolderPath, operationItemId }),

    getQuestFileJoinArgs: ({
      questFolderPath,
    }: {
      questFolderPath: AbsoluteFilePath;
    }): readonly unknown[] | undefined => joinHandle.callsMatching([questFolderPath]).at(0),
  };
};
