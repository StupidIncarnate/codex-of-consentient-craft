/**
 * PURPOSE: Proxy for questGetQuestWorkBroker. Stages the I/O boundaries it crosses, IN THE ORDER it
 * crosses them — the quest path lookup and read, the plan-file read, then the two layer brokers.
 * That order is load-bearing: `pathJoinAdapterProxy.returns` is a call-ordered one-shot queue, so
 * staging the plan before the quest hands the quest read the plan file's path.
 *
 * USAGE:
 * const proxy = questGetQuestWorkBrokerProxy();
 * proxy.setupQuestWithNoPlan({ quest, operationItemId });
 * const view = await questGetQuestWorkBroker({ questId, workItemId });
 *
 * Every scenario resolves the cwd to `missing-worktree`, so no git command is spawned and the git
 * rows come back empty — the reachable-worktree case is `gitRowsLayerBroker`'s own test, and this
 * proxy exists to exercise the ASSEMBLY.
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
import { gitRowsLayerBrokerProxy } from './git-rows-layer-broker.proxy';
import { wardRowsLayerBrokerProxy } from './ward-rows-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type WorkPlan = ReturnType<typeof WorkPlanStub>;

const HOME_DIR = '/home/testuser';
const PLAN_FOLDER_PATH = AbsoluteFilePathStub({
  value: '/home/testuser/.dungeonmaster/guilds/g1/quests/001-add-auth',
});

export const questGetQuestWorkBrokerProxy = (): {
  setupQuestWithNoPlan: (params: { quest: Quest; operationItemId: OperationItemId }) => void;
  setupQuestWithPlan: (params: {
    quest: Quest;
    operationItemId: OperationItemId;
    plan: WorkPlan;
  }) => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const plannedWorkProxy = plannedWorkReadBrokerProxy();
  const gitRowsProxy = gitRowsLayerBrokerProxy();
  // Created, never staged: every scenario here holds a green quest, so the ward layer reads nothing.
  wardRowsLayerBrokerProxy();

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
    setupQuestWithNoPlan: ({ quest, operationItemId }): void => {
      stageQuestRead({ quest });
      plannedWorkProxy.setupPlanMissing({
        questFolderPath: PLAN_FOLDER_PATH,
        operationItemId,
      });
      gitRowsProxy.setupWorktreeMissing({ quest });
    },

    setupQuestWithPlan: ({ quest, operationItemId, plan }): void => {
      stageQuestRead({ quest });
      plannedWorkProxy.setupPlanFound({
        questFolderPath: PLAN_FOLDER_PATH,
        operationItemId,
        plan,
      });
      gitRowsProxy.setupWorktreeMissing({ quest });
    },
  };
};
