/**
 * PURPOSE: Public API for the orchestrator package providing guild management, quest management, and orchestration functions
 *
 * USAGE:
 * import { StartOrchestrator } from '@dungeonmaster/orchestrator';
 * const guilds = await StartOrchestrator.listGuilds();
 * const quests = await StartOrchestrator.listQuests({guildId});
 * const quest = await StartOrchestrator.loadQuest({questId});
 * const added = await StartOrchestrator.addQuest({title: 'Add Auth', userRequest: 'User wants...', guildId});
 * const got = await StartOrchestrator.getQuest({questId: 'add-auth'});
 * const modified = await StartOrchestrator.modifyQuest({questId: 'add-auth', input: {...}});
 */

import { randomUUID } from 'crypto';

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type {
  DirectoryEntry,
  Guild,
  GuildId,
  GuildListItem,
  GuildName,
  GuildPath,
  OrchestrationStatus,
  ProcessId,
  Quest,
  QuestId,
  QuestListItem,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { readlineCreateInterfaceAdapter } from '../adapters/readline/create-interface/readline-create-interface-adapter';
import { chatHistoryReplayBroker } from '../brokers/chat/history-replay/chat-history-replay-broker';
import { chatSpawnBroker } from '../brokers/chat/spawn/chat-spawn-broker';
import { directoryBrowseBroker } from '../brokers/directory/browse/directory-browse-broker';
import { pathseekerPipelineBroker } from '../brokers/pathseeker/pipeline/pathseeker-pipeline-broker';
import { guildAddBroker } from '../brokers/guild/add/guild-add-broker';
import { guildGetBroker } from '../brokers/guild/get/guild-get-broker';
import { guildListBroker } from '../brokers/guild/list/guild-list-broker';
import { guildRemoveBroker } from '../brokers/guild/remove/guild-remove-broker';
import { guildUpdateBroker } from '../brokers/guild/update/guild-update-broker';
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
import { chatProcessState } from '../state/chat-process/chat-process-state';
import { orchestrationEventsState } from '../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../state/orchestration-processes/orchestration-processes-state';
import { pathseekerPromptStatics } from '../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { streamJsonLineContract } from '../contracts/stream-json-line/stream-json-line-contract';
import { questToListItemTransformer } from '../transformers/quest-to-list-item/quest-to-list-item-transformer';
import { streamJsonToClarificationTransformer } from '../transformers/stream-json-to-clarification/stream-json-to-clarification-transformer';

const QUEST_FILE_NAME = 'quest.json';

export const StartOrchestrator = {
  // Guild methods
  listGuilds: async (): Promise<GuildListItem[]> => guildListBroker(),

  getGuild: async ({ guildId }: { guildId: GuildId }): Promise<Guild> =>
    guildGetBroker({ guildId }),

  addGuild: async ({ name, path }: { name: GuildName; path: GuildPath }): Promise<Guild> =>
    guildAddBroker({ name, path }),

  updateGuild: async ({
    guildId,
    name,
    path,
  }: {
    guildId: GuildId;
    name?: GuildName;
    path?: GuildPath;
  }): Promise<Guild> =>
    guildUpdateBroker({
      guildId,
      ...(name !== undefined && { name }),
      ...(path !== undefined && { path }),
    }),

  removeGuild: async ({ guildId }: { guildId: GuildId }): Promise<void> =>
    guildRemoveBroker({ guildId }),

  browseDirectories: ({ path }: { path?: GuildPath }): DirectoryEntry[] =>
    directoryBrowseBroker(path === undefined ? {} : { path }),

  // Quest methods
  listQuests: async ({ guildId }: { guildId: GuildId }): Promise<QuestListItem[]> => {
    const quests = await questListBroker({ guildId });
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
    const { questPath, guildId } = await questFindQuestPathBroker({ questId });

    const guild = await guildGetBroker({ guildId });
    const startPath = filePathContract.parse(guild.path);

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    const quests = await questListBroker({ guildId });
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
    guildId,
  }: {
    title: string;
    userRequest: string;
    guildId: GuildId;
  }): Promise<AddQuestResult> => {
    const input = addQuestInputContract.parse({ title, userRequest });
    const result = await questAddBroker({ input, guildId });

    if (result.success) {
      orchestrationEventsState.emit({
        type: 'quest-created',
        processId: processIdContract.parse(randomUUID()),
        payload: {
          questId: result.questId,
          questFolder: result.questFolder,
          guildId,
          title,
        },
      });
    }

    return result;
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
  }): Promise<ModifyQuestResult> => {
    const result = await questModifyBroker({ input: { ...input, questId } as ModifyQuestInput });

    if (result.success) {
      const { guildId } = await questFindQuestPathBroker({ questId: questId as QuestId });

      orchestrationEventsState.emit({
        type: 'quest-modified',
        processId: processIdContract.parse(randomUUID()),
        payload: { questId, guildId },
      });
    }

    return result;
  },

  // Chat methods
  startChat: async ({
    guildId,
    message,
    sessionId,
  }: {
    guildId: GuildId;
    message: string;
    sessionId?: SessionId;
  }): Promise<{ chatProcessId: ProcessId }> =>
    chatSpawnBroker({
      guildId,
      message,
      ...(sessionId && { sessionId }),
      onLine: ({ chatProcessId, line }) => {
        orchestrationEventsState.emit({
          type: 'chat-output',
          processId: chatProcessId,
          payload: { chatProcessId, line },
        });

        const lineParseResult = streamJsonLineContract.safeParse(line);
        if (lineParseResult.success) {
          const clarification = streamJsonToClarificationTransformer({
            line: lineParseResult.data,
          });
          if (clarification) {
            orchestrationEventsState.emit({
              type: 'clarification-request',
              processId: chatProcessId,
              payload: { chatProcessId, questions: clarification.questions },
            });
          }
        }
      },
      onComplete: ({ chatProcessId, exitCode, sessionId: sid }) => {
        chatProcessState.remove({ processId: chatProcessId });
        orchestrationEventsState.emit({
          type: 'chat-complete',
          processId: chatProcessId,
          payload: { chatProcessId, exitCode, sessionId: sid },
        });
      },
      registerProcess: ({ processId, kill }) => {
        chatProcessState.register({ processId, kill });
      },
    }),

  stopChat: ({ chatProcessId }: { chatProcessId: ProcessId }): boolean =>
    chatProcessState.kill({ processId: chatProcessId }),

  stopAllChats: (): void => {
    chatProcessState.killAll();
  },

  replayChatHistory: async ({
    sessionId,
    guildId,
    chatProcessId: clientChatProcessId,
  }: {
    sessionId: SessionId;
    guildId: GuildId;
    chatProcessId?: ProcessId;
  }): Promise<void> => {
    const chatProcessId = clientChatProcessId ?? processIdContract.parse(`replay-${randomUUID()}`);

    await chatHistoryReplayBroker({
      sessionId,
      guildId,
      onEntry: ({ entry }) => {
        orchestrationEventsState.emit({
          type: 'chat-output',
          processId: chatProcessId,
          payload: { chatProcessId, line: JSON.stringify(entry) },
        });
      },
      onPatch: ({ toolUseId, agentId }) => {
        orchestrationEventsState.emit({
          type: 'chat-patch',
          processId: chatProcessId,
          payload: { chatProcessId, toolUseId, agentId },
        });
      },
    });

    orchestrationEventsState.emit({
      type: 'chat-history-complete',
      processId: chatProcessId,
      payload: { chatProcessId, sessionId },
    });
  },
};
