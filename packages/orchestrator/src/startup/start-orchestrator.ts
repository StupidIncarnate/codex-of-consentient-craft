/**
 * PURPOSE: Public API for the orchestrator package providing quest management and orchestration functions
 *
 * USAGE:
 * import { StartOrchestrator } from '@dungeonmaster/orchestrator';
 * const quests = await StartOrchestrator.listQuests({startPath: '/my/project'});
 * const quest = await StartOrchestrator.loadQuest({questId: 'add-auth', startPath: '/my/project'});
 * const added = await StartOrchestrator.addQuest({title: 'Add Auth', userRequest: 'User wants...', startPath: '/my/project'});
 * const got = await StartOrchestrator.getQuest({questId: 'add-auth', startPath: '/my/project'});
 * const modified = await StartOrchestrator.modifyQuest({questId: 'add-auth', input: {...}, startPath: '/my/project'});
 */

import { randomUUID } from 'crypto';

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { questsFolderEnsureBroker } from '@dungeonmaster/shared/brokers';
import type {
  FilePath,
  OrchestrationStatus,
  ProcessId,
  Quest,
  QuestId,
  QuestListItem,
} from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { questAddBroker } from '../brokers/quest/add/quest-add-broker';
import { questGetBroker } from '../brokers/quest/get/quest-get-broker';
import { questListBroker } from '../brokers/quest/list/quest-list-broker';
import { questLoadBroker } from '../brokers/quest/load/quest-load-broker';
import { questModifyBroker } from '../brokers/quest/modify/quest-modify-broker';
import { questVerifyBroker } from '../brokers/quest/verify/quest-verify-broker';
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
import { orchestrationProcessContract } from '../contracts/orchestration-process/orchestration-process-contract';
import { promptTextContract } from '../contracts/prompt-text/prompt-text-contract';
import { totalCountContract } from '../contracts/total-count/total-count-contract';
import { orchestrationProcessesState } from '../state/orchestration-processes/orchestration-processes-state';
import { pathseekerPromptStatics } from '../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { questToListItemTransformer } from '../transformers/quest-to-list-item/quest-to-list-item-transformer';

const QUEST_FILE_NAME = 'quest.json';

export const StartOrchestrator = {
  listQuests: async ({ startPath }: { startPath: FilePath }): Promise<QuestListItem[]> => {
    const quests = await questListBroker({ startPath });
    return quests.map((quest) => questToListItemTransformer({ quest }));
  },

  loadQuest: async ({
    questId,
    startPath,
  }: {
    questId: QuestId;
    startPath: FilePath;
  }): Promise<Quest> => {
    const { questsBasePath } = await questsFolderEnsureBroker({ startPath });

    // Find quest folder by looking for folder starting with number and containing the quest ID
    const quests = await questListBroker({ startPath });
    const quest = quests.find((q) => q.id === questId);

    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const questFilePath = pathJoinAdapter({
      paths: [questsBasePath, quest.folder, QUEST_FILE_NAME],
    });

    return questLoadBroker({ questFilePath });
  },

  startQuest: async ({
    questId,
    startPath,
  }: {
    questId: QuestId;
    startPath: FilePath;
  }): Promise<ProcessId> => {
    const quests = await questListBroker({ startPath });
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

    const { process: childProcess } = childProcessSpawnStreamJsonAdapter({ prompt });

    const processId = processIdContract.parse(`proc-${randomUUID()}`);

    const killableProcess: KillableProcess = {
      kill: () => childProcess.kill(),
      waitForExit: async () =>
        new Promise<void>((resolve) => {
          childProcess.on('exit', () => {
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
    startPath,
  }: {
    title: string;
    userRequest: string;
    startPath: FilePath;
  }): Promise<AddQuestResult> => {
    const input = addQuestInputContract.parse({ title, userRequest });
    return questAddBroker({ input, startPath });
  },

  getQuest: async ({
    questId,
    sections,
    startPath,
  }: {
    questId: string;
    sections?: string[];
    startPath: FilePath;
  }): Promise<GetQuestResult> => {
    const input = getQuestInputContract.parse({ questId, ...(sections && { sections }) });
    return questGetBroker({ input, startPath });
  },

  verifyQuest: async ({
    questId,
    startPath,
  }: {
    questId: string;
    startPath: FilePath;
  }): Promise<VerifyQuestResult> => {
    const input = verifyQuestInputContract.parse({ questId });
    return questVerifyBroker({ input, startPath });
  },

  modifyQuest: async ({
    questId,
    input,
    startPath,
  }: {
    questId: string;
    input: ModifyQuestInput;
    startPath: FilePath;
  }): Promise<ModifyQuestResult> =>
    questModifyBroker({ input: { ...input, questId } as ModifyQuestInput, startPath }),
};
