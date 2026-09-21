/**
 * PURPOSE: Proxy for questGetWorkPlanBroker. Stages the quest read and the plan-file read, in that
 * order — `pathJoinAdapterProxy.returns` is a call-ordered one-shot queue, so staging the plan first
 * would hand the quest read the plan file's path.
 *
 * USAGE:
 * const proxy = questGetWorkPlanBrokerProxy();
 * proxy.setupPlanFound({ quest, operationItemId, plan });
 * const text = await questGetWorkPlanBroker({ questId, operationItemId });
 */

import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';
import type { OperationItemId, QuestStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import type { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkReadBrokerProxy } from '../../planned-work/read/planned-work-read-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type WorkPlan = ReturnType<typeof WorkPlanStub>;

const HOME_DIR = '/home/testuser';
const PLAN_FOLDER_PATH = AbsoluteFilePathStub({
  value: '/home/testuser/.dungeonmaster/guilds/g1/quests/001-add-auth',
});

export const questGetWorkPlanBrokerProxy = (): {
  setupPlanFound: (params: {
    quest: Quest;
    operationItemId: OperationItemId;
    plan: WorkPlan;
  }) => void;
  setupPlanMissing: (params: { quest: Quest; operationItemId: OperationItemId }) => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const plannedWorkProxy = plannedWorkReadBrokerProxy();

  const stageQuestRead = ({ quest }: { quest: Quest }): void => {
    const guildId = GuildIdStub();
    const questsDirPath = FilePathStub({
      value: `${HOME_DIR}/.dungeonmaster/guilds/${guildId}/quests`,
    });
    const questFolderPath = FilePathStub({ value: `${questsDirPath}/${quest.folder}` });
    const questFilePath = FilePathStub({ value: `${questFolderPath}/quest.json` });

    findQuestPathProxy.setupQuestFound({
      homeDir: HOME_DIR,
      homePath: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster` }),
      guildsDir: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster/guilds` }),
      guilds: [
        {
          dirName: FileNameStub({ value: guildId }),
          questsDirPath,
          questFolders: [
            {
              folderName: FileNameStub({ value: quest.folder }),
              questFilePath,
              questFolderPath,
              contents: FileContentsStub({ value: JSON.stringify(quest) }),
            },
          ],
        },
      ],
    });

    pathJoinProxy.returns({ result: questFilePath });
    loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
  };

  return {
    setupPlanFound: ({ quest, operationItemId, plan }): void => {
      stageQuestRead({ quest });
      plannedWorkProxy.setupPlanFound({
        questFolderPath: PLAN_FOLDER_PATH,
        operationItemId,
        plan,
      });
    },

    setupPlanMissing: ({ quest, operationItemId }): void => {
      stageQuestRead({ quest });
      plannedWorkProxy.setupPlanMissing({
        questFolderPath: PLAN_FOLDER_PATH,
        operationItemId,
      });
    },
  };
};
