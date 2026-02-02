/**
 * PURPOSE: Public API for the orchestrator package providing quest management and orchestration functions
 *
 * USAGE:
 * import { StartOrchestrator } from '@dungeonmaster/orchestrator';
 * const quests = await StartOrchestrator.listQuests({startPath: '/my/project'});
 * const quest = await StartOrchestrator.loadQuest({questId: 'add-auth', startPath: '/my/project'});
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
import { questListBroker } from '../brokers/quest/list/quest-list-broker';
import { questLoadBroker } from '../brokers/quest/load/quest-load-broker';
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
};
