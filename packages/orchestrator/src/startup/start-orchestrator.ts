/**
 * PURPOSE: Public API for the orchestrator package providing project management, quest management, and orchestration functions
 *
 * USAGE:
 * import { StartOrchestrator } from '@dungeonmaster/orchestrator';
 * const projects = await StartOrchestrator.listProjects();
 * const quests = await StartOrchestrator.listQuests({projectId});
 * const quest = await StartOrchestrator.loadQuest({questId});
 * const added = await StartOrchestrator.addQuest({title: 'Add Auth', userRequest: 'User wants...', projectId});
 * const got = await StartOrchestrator.getQuest({questId: 'add-auth'});
 * const modified = await StartOrchestrator.modifyQuest({questId: 'add-auth', input: {...}});
 */

import { randomUUID } from 'crypto';

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type {
  DirectoryEntry,
  OrchestrationStatus,
  ProcessId,
  Project,
  ProjectId,
  ProjectListItem,
  ProjectName,
  ProjectPath,
  Quest,
  QuestId,
  QuestListItem,
} from '@dungeonmaster/shared/contracts';
import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { readlineCreateInterfaceAdapter } from '../adapters/readline/create-interface/readline-create-interface-adapter';
import { directoryBrowseBroker } from '../brokers/directory/browse/directory-browse-broker';
import { pathseekerPipelineBroker } from '../brokers/pathseeker/pipeline/pathseeker-pipeline-broker';
import { projectAddBroker } from '../brokers/project/add/project-add-broker';
import { projectGetBroker } from '../brokers/project/get/project-get-broker';
import { projectListBroker } from '../brokers/project/list/project-list-broker';
import { projectRemoveBroker } from '../brokers/project/remove/project-remove-broker';
import { projectUpdateBroker } from '../brokers/project/update/project-update-broker';
import { questAddBroker } from '../brokers/quest/add/quest-add-broker';
import { questFindQuestPathBroker } from '../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../brokers/quest/get/quest-get-broker';
import { questListBroker } from '../brokers/quest/list/quest-list-broker';
import { questLoadBroker } from '../brokers/quest/load/quest-load-broker';
import { questModifyBroker } from '../brokers/quest/modify/quest-modify-broker';
import { questVerifyBroker } from '../brokers/quest/verify/quest-verify-broker';
import { questPipelineBroker } from '../brokers/quest/pipeline/quest-pipeline-broker';
import { addQuestInputContract } from '../contracts/add-quest-input/add-quest-input-contract';
import type { AddQuestResult } from '../contracts/add-quest-result/add-quest-result-contract';
import { getQuestInputContract } from '../contracts/get-quest-input/get-quest-input-contract';
import type { GetQuestResult } from '../contracts/get-quest-result/get-quest-result-contract';
import type { ModifyQuestInput } from '../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestResult } from '../contracts/modify-quest-result/modify-quest-result-contract';
import { verifyQuestInputContract } from '../contracts/verify-quest-input/verify-quest-input-contract';
import type { VerifyQuestResult } from '../contracts/verify-quest-result/verify-quest-result-contract';
import { completedCountContract } from '../contracts/completed-count/completed-count-contract';
import { isoTimestampContract } from '../contracts/iso-timestamp/iso-timestamp-contract';
import type { KillableProcess } from '../contracts/killable-process/killable-process-contract';
import { orchestrationPhaseContract } from '../contracts/orchestration-phase/orchestration-phase-contract';
import { orchestrationProcessContract } from '../contracts/orchestration-process/orchestration-process-contract';
import { promptTextContract } from '../contracts/prompt-text/prompt-text-contract';
import { slotIndexContract } from '../contracts/slot-index/slot-index-contract';
import { totalCountContract } from '../contracts/total-count/total-count-contract';
import { orchestrationEventsState } from '../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../state/orchestration-processes/orchestration-processes-state';
import { pathseekerPromptStatics } from '../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { questToListItemTransformer } from '../transformers/quest-to-list-item/quest-to-list-item-transformer';

const QUEST_FILE_NAME = 'quest.json';

export const StartOrchestrator = {
  // Project methods
  listProjects: async (): Promise<ProjectListItem[]> => projectListBroker(),

  getProject: async ({ projectId }: { projectId: ProjectId }): Promise<Project> =>
    projectGetBroker({ projectId }),

  addProject: async ({ name, path }: { name: ProjectName; path: ProjectPath }): Promise<Project> =>
    projectAddBroker({ name, path }),

  updateProject: async ({
    projectId,
    name,
    path,
  }: {
    projectId: ProjectId;
    name?: ProjectName;
    path?: ProjectPath;
  }): Promise<Project> =>
    projectUpdateBroker({
      projectId,
      ...(name !== undefined && { name }),
      ...(path !== undefined && { path }),
    }),

  removeProject: async ({ projectId }: { projectId: ProjectId }): Promise<void> =>
    projectRemoveBroker({ projectId }),

  browseDirectories: ({ path }: { path?: ProjectPath }): DirectoryEntry[] =>
    directoryBrowseBroker(path === undefined ? {} : { path }),

  // Quest methods
  listQuests: async ({ projectId }: { projectId: ProjectId }): Promise<QuestListItem[]> => {
    const quests = await questListBroker({ projectId });
    return quests.map((quest) => questToListItemTransformer({ quest }));
  },

  loadQuest: async ({ questId }: { questId: QuestId }): Promise<Quest> => {
    const { questPath } = await questFindQuestPathBroker({ questId });

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    return questLoadBroker({ questFilePath });
  },

  startQuest: async ({ questId }: { questId: QuestId }): Promise<ProcessId> => {
    const { questPath, projectId } = await questFindQuestPathBroker({ questId });

    const project = await projectGetBroker({ projectId });
    const startPath = filePathContract.parse(project.path);

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    const quests = await questListBroker({ projectId });
    const quest = quests.find((q) => q.id === questId);

    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const totalSteps = totalCountContract.parse(quest.steps.length);

    const promptText = pathseekerPromptStatics.prompt.template.replace(
      pathseekerPromptStatics.prompt.placeholders.arguments,
      `Quest ID: ${questId}`,
    );

    const prompt = promptTextContract.parse(promptText);

    const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter({ prompt });

    const processId = processIdContract.parse(`proc-${randomUUID()}`);

    const pathseekerSlotIndex = slotIndexContract.parse(0);
    const pathseekerRl = readlineCreateInterfaceAdapter({ input: stdout });
    pathseekerRl.onLine(({ line }) => {
      orchestrationEventsState.emit({
        type: 'agent-output',
        processId,
        payload: { slotIndex: pathseekerSlotIndex, line },
      });
    });

    const killableProcess: KillableProcess = {
      kill: () => childProcess.kill(),
      waitForExit: async () =>
        new Promise<void>((resolve) => {
          childProcess.on('exit', () => {
            pathseekerRl.close();
            resolve();
          });
        }),
    };

    const orchestrationProcess = orchestrationProcessContract.parse({
      processId,
      questId,
      process: killableProcess,
      phase: 'pathseeker',
      completedSteps: completedCountContract.parse(0),
      totalSteps,
      startedAt: isoTimestampContract.parse(new Date().toISOString()),
      slots: [],
    });

    orchestrationProcessesState.register({ orchestrationProcess });

    pathseekerPipelineBroker({
      processId,
      questId,
      killableProcess,
      attempt: 0,
      onVerifySuccess: () => {
        questPipelineBroker({
          processId,
          questId,
          questFilePath,
          startPath,
          onPhaseChange: ({ phase }) => {
            orchestrationProcessesState.updatePhase({ processId, phase });
            orchestrationEventsState.emit({
              type: 'phase-change',
              processId,
              payload: { phase },
            });
          },
          onAgentLine: ({ slotIndex, line }) => {
            orchestrationEventsState.emit({
              type: 'agent-output',
              processId,
              payload: { slotIndex, line },
            });
          },
        }).catch(() => {
          const phase = orchestrationPhaseContract.parse('failed');
          orchestrationProcessesState.updatePhase({ processId, phase });
          orchestrationEventsState.emit({
            type: 'phase-change',
            processId,
            payload: { phase },
          });
        });
      },
      onProcessUpdate: ({ process }) => {
        orchestrationProcessesState.updateProcess({ processId, process });
      },
    }).catch(() => {
      const phase = orchestrationPhaseContract.parse('failed');
      orchestrationProcessesState.updatePhase({ processId, phase });
      orchestrationEventsState.emit({
        type: 'phase-change',
        processId,
        payload: { phase },
      });
    });

    return processId;
  },

  getQuestStatus: ({ processId }: { processId: ProcessId }): OrchestrationStatus => {
    const status = orchestrationProcessesState.getStatus({ processId });

    if (!status) {
      throw new Error(`Process not found: ${processId}`);
    }

    return status;
  },

  addQuest: async ({
    title,
    userRequest,
    projectId,
  }: {
    title: string;
    userRequest: string;
    projectId: ProjectId;
  }): Promise<AddQuestResult> => {
    const input = addQuestInputContract.parse({ title, userRequest });
    return questAddBroker({ input, projectId });
  },

  getQuest: async ({
    questId,
    stage,
  }: {
    questId: string;
    stage?: string;
  }): Promise<GetQuestResult> => {
    const input = getQuestInputContract.parse({ questId, ...(stage && { stage }) });
    return questGetBroker({ input });
  },

  verifyQuest: async ({ questId }: { questId: string }): Promise<VerifyQuestResult> => {
    const input = verifyQuestInputContract.parse({ questId });
    return questVerifyBroker({ input });
  },

  modifyQuest: async ({
    questId,
    input,
  }: {
    questId: string;
    input: ModifyQuestInput;
  }): Promise<ModifyQuestResult> =>
    questModifyBroker({ input: { ...input, questId } as ModifyQuestInput }),
};
