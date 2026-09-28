/**
 * PURPOSE: Proxy for questGetQuestWorkBroker. Stages the I/O boundaries it crosses — the quest path
 * lookup and read (its own `join` call, addressed by the exact folder/file tuple), the plan-file
 * read, then the two layer brokers. The plan-file read is staged against the SAME resolved
 * `questFolderPath` the quest read used — never a separate constant — because
 * `questGetQuestWorkBroker` passes `questPath` straight through to `plannedWorkReadBroker`, whose
 * own `join` call is exact-tuple addressed: a mismatched folder answers nothing, and the plan read
 * fails on the unmatched staging instead of reading back as silently missing.
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
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import type { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkReadBrokerProxy } from '../../planned-work/read/planned-work-read-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { gitRowsLayerBrokerProxy } from './git-rows-layer-broker.proxy';
import { wardRowsLayerBrokerProxy } from './ward-rows-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type WorkPlan = ReturnType<typeof WorkPlanStub>;
type FilePathValue = ReturnType<typeof FilePathStub>;

const HOME_DIR = '/home/testuser';

export const questGetQuestWorkBrokerProxy = (): {
  setupQuestWithNoPlan: (params: { quest: Quest; operationItemId: OperationItemId }) => {
    questFolderPath: FilePathValue;
  };
  setupQuestWithPlan: (params: {
    quest: Quest;
    operationItemId: OperationItemId;
    plan: WorkPlan;
  }) => { questFolderPath: FilePathValue };
  getQuestFileJoinArgs: (params: {
    questFolderPath: FilePathValue;
  }) => readonly unknown[] | undefined;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  const plannedWorkProxy = plannedWorkReadBrokerProxy();
  const gitRowsProxy = gitRowsLayerBrokerProxy();
  // Created, never staged: every scenario here holds a green quest, so the ward layer reads nothing.
  wardRowsLayerBrokerProxy();

  const stageQuestRead = ({ quest }: { quest: Quest }): { questFolderPath: FilePathValue } => {
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

    joinHandle
      .calledWith([questFolderPath, locationsStatics.quest.questFile])
      .returns(questFilePath);
    loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

    return { questFolderPath };
  };

  return {
    setupQuestWithNoPlan: ({ quest, operationItemId }): { questFolderPath: FilePathValue } => {
      const { questFolderPath } = stageQuestRead({ quest });
      // Re-branded from the FilePath the find-quest-path fixture needed to AbsoluteFilePath, the
      // brand plannedWorkReadBrokerProxy requires — same string value, so the plan-file read is
      // staged against the SAME folder plannedWorkReadBroker is really called with.
      plannedWorkProxy.setupPlanMissing({
        questFolderPath: AbsoluteFilePathStub({ value: String(questFolderPath) }),
        operationItemId,
      });
      gitRowsProxy.setupWorktreeMissing({ quest });

      return { questFolderPath };
    },

    setupQuestWithPlan: ({ quest, operationItemId, plan }): { questFolderPath: FilePathValue } => {
      const { questFolderPath } = stageQuestRead({ quest });
      plannedWorkProxy.setupPlanFound({
        questFolderPath: AbsoluteFilePathStub({ value: String(questFolderPath) }),
        operationItemId,
        plan,
      });
      gitRowsProxy.setupWorktreeMissing({ quest });

      return { questFolderPath };
    },

    // `.at(0)`, never `.at(-1)`: `gitRowsLayerBroker` runs `questCwdResolveBroker` for real, which
    // re-derives the quest via its own `questGetBroker` call and joins this SAME folder with
    // `quest.json` a second time — this broker's OWN join is always the FIRST one recorded,
    // because it runs before any of the later layer brokers are reached.
    getQuestFileJoinArgs: ({
      questFolderPath,
    }: {
      questFolderPath: FilePathValue;
    }): readonly unknown[] | undefined => joinHandle.callsMatching([questFolderPath]).at(0),
  };
};
