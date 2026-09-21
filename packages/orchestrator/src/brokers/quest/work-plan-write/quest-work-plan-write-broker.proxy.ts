import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import type { OperationItemIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
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
} => {
  questFindQuestPathBrokerProxy();
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const pathJoinProxy = pathJoinAdapterProxy();
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

      pathJoinProxy.returns({ result: questFilePath });

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
  };
};
