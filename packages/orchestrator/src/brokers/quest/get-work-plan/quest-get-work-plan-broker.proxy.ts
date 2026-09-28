/**
 * PURPOSE: Proxy for questGetWorkPlanBroker. Stages the quest read (exact-tuple addressed join,
 * so it can never answer the plan-file read's own address) ahead of the plan-file read. The
 * plan-file read is staged against the SAME resolved `questFolderPath` the quest read used —
 * never a separate constant — because `questGetWorkPlanBroker` passes `questPath` straight
 * through to `plannedWorkReadBroker`, and `plannedWorkReadBroker`'s own `join` call is now
 * exact-tuple addressed too: a mismatched folder answers nothing, and the plan read
 * fails on the unmatched staging instead of reading back as silently missing.
 *
 * USAGE:
 * const proxy = questGetWorkPlanBrokerProxy();
 * proxy.setupPlanFound({ quest, operationItemId, plan });
 * const text = await questGetWorkPlanBroker({ questId, operationItemId });
 */

import { join } from '#gateway/node/path';

import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';
import type { OperationItemId, QuestStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkReadBrokerProxy } from '../../planned-work/read/planned-work-read-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type WorkPlan = ReturnType<typeof WorkPlanStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

const HOME_DIR = '/home/testuser';

export const questGetWorkPlanBrokerProxy = (): {
  setupPlanFound: (params: {
    quest: Quest;
    operationItemId: OperationItemId;
    plan: WorkPlan;
  }) => void;
  setupPlanMissing: (params: { quest: Quest; operationItemId: OperationItemId }) => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  const plannedWorkProxy = plannedWorkReadBrokerProxy();

  const stageQuestRead = ({ quest }: { quest: Quest }): { questFolderPath: AbsoluteFilePath } => {
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

    // questGetWorkPlanBroker's own join(questPath, quest.json) -> questFilePath, addressed by the
    // exact tuple rather than an address-less FIFO slot, so it can never answer a different
    // broker's join call sharing the same underlying mocked `join`.
    joinHandle
      .calledWith([questFolderPath, locationsStatics.quest.questFile])
      .returns(questFilePath);
    loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

    // Re-branded from the FilePath the find-quest-path fixture needed to AbsoluteFilePath, the
    // brand plannedWorkReadBrokerProxy requires — same string value, so the plan-file read is
    // staged against the SAME folder plannedWorkReadBroker is really called with.
    return { questFolderPath: AbsoluteFilePathStub({ value: String(questFolderPath) }) };
  };

  return {
    setupPlanFound: ({ quest, operationItemId, plan }): void => {
      const { questFolderPath } = stageQuestRead({ quest });
      plannedWorkProxy.setupPlanFound({
        questFolderPath,
        operationItemId,
        plan,
      });
    },

    setupPlanMissing: ({ quest, operationItemId }): void => {
      const { questFolderPath } = stageQuestRead({ quest });
      plannedWorkProxy.setupPlanMissing({
        questFolderPath,
        operationItemId,
      });
    },
  };
};
