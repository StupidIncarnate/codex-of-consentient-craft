/**
 * PURPOSE: Spawns a Claude CLI chat process for either ChaosWhisperer or Glyphsmith role with event emission for output streaming and lifecycle tracking
 *
 * USAGE:
 * const { chatProcessId } = await chatSpawnBroker({
 *   role: 'chaoswhisperer',
 *   guildId: GuildIdStub(),
 *   message: 'Help me build auth',
 *   processor,
 *   onEntry: ({ chatProcessId, entry }) => {},
 *   onPatch: ({ chatProcessId, toolUseId, agentId }) => {},
 *   onAgentDetected: ({ chatProcessId, toolUseId, agentId, sessionId }) => {},
 *   onComplete: ({ chatProcessId, exitCode, sessionId }) => {},
 *   registerProcess: ({ processId, kill }) => {},
 * });
 * // Spawns Claude CLI with role-specific prompt, streams output via callbacks, returns chatProcessId
 */

import type { GuildId, QuestId, SessionId, WorkItemRole } from '@dungeonmaster/shared/contracts';
import {
  absoluteFilePathContract,
  processIdContract,
  sessionIdContract,
  streamJsonLineContract,
} from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { agentIdContract } from '../../../contracts/agent-id/agent-id-contract';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import { addQuestInputContract } from '../../../contracts/add-quest-input/add-quest-input-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { questStatics } from '../../../statics/quest/quest-statics';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { taskToolUseIdsFromContentTransformer } from '../../../transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { agentFilesEnsureBroker } from '../../agent/files-ensure/agent-files-ensure-broker';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questAddBroker } from '../../quest/add/quest-add-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';

export const chatSpawnBroker = async ({
  role,
  guildId,
  questId,
  message,
  sessionId,
  processor,
  onEntry,
  onPatch,
  onAgentDetected,
  onComplete,
  onQuestCreated,
  onDesignSessionLinked,
  registerProcess,
}: {
  role: WorkItemRole;
  guildId: GuildId;
  questId?: QuestId;
  message: string;
  sessionId?: SessionId;
  processor: ChatLineProcessor;
  onEntry: (params: { chatProcessId: ProcessId; entry: ChatLineEntry['entry'] }) => void;
  onPatch: (params: { chatProcessId: ProcessId; toolUseId: ToolUseId; agentId: AgentId }) => void;
  onAgentDetected: (params: {
    chatProcessId: ProcessId;
    toolUseId: ToolUseId;
    agentId: AgentId;
    sessionId: SessionId;
  }) => void;
  onComplete: (params: {
    chatProcessId: ProcessId;
    exitCode: number | null;
    sessionId: SessionId | null;
  }) => void;
  onQuestCreated?: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  onDesignSessionLinked?: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  registerProcess: (params: { processId: ProcessId; kill: () => void }) => void;
}): Promise<{ chatProcessId: ProcessId }> => {
  const prefix = role === 'chaoswhisperer' ? 'chat' : 'design';
  const chatProcessId = processIdContract.parse(`${prefix}-${crypto.randomUUID()}`);
  const guild = await guildGetBroker({ guildId });
  const sessionSource = chatLineSourceContract.parse('session');

  let resolvedQuestId: QuestId | null = null;

  if (role === 'glyphsmith') {
    if (!questId) {
      throw new Error('questId is required for glyphsmith role');
    }
    const input = getQuestInputContract.parse({ questId });
    const result = await questGetBroker({ input });
    if (!result.success || !result.quest) {
      throw new Error(`Quest not found: ${questId}`);
    }
    const questStatus = result.quest.status;
    const allowedStatuses = questStatics.designStatuses.allowed;
    const isValidStatus = allowedStatuses.some((status) => status === questStatus);
    if (!isValidStatus) {
      throw new Error(
        `Quest must be in a design status (${allowedStatuses.join(', ')}) to start design chat. Current status: ${questStatus}`,
      );
    }
    resolvedQuestId = questId;
  } else if (sessionId) {
    resolvedQuestId = questId ?? null;
  } else {
    const addInput = addQuestInputContract.parse({ title: 'New Quest', userRequest: message });
    const questResult = await questAddBroker({ input: addInput, guildId });
    if (!questResult.success || !questResult.questId) {
      throw new Error(`Failed to create quest: ${questResult.error ?? 'unknown'}`);
    }
    onQuestCreated?.({ questId: questResult.questId, chatProcessId });
    resolvedQuestId = questResult.questId;
  }

  const prompt = chatPromptBuildTransformer({
    role,
    message,
    questId: resolvedQuestId,
    ...(sessionId ? { sessionId } : {}),
  });

  const guildAbsolutePath = absoluteFilePathContract.parse(guild.path);
  await agentFilesEnsureBroker({ targetPath: guildAbsolutePath });

  const { kill, sessionId$ } = agentSpawnUnifiedBroker({
    prompt,
    cwd: guildAbsolutePath,
    ...(sessionId ? { resumeSessionId: sessionId } : {}),
    onLine: ({ line }) => {
      const lineParseResult = streamJsonLineContract.safeParse(line);

      if (!lineParseResult.success) {
        return;
      }

      const outputs = processor.processLine({
        line: lineParseResult.data,
        source: sessionSource,
      });

      for (const output of outputs) {
        if (output.type === 'entry') {
          onEntry({ chatProcessId, entry: output.entry });

          const taskToolUseIds = taskToolUseIdsFromContentTransformer({ entry: output.entry });
          const entryAgentId: unknown = Reflect.get(output.entry, 'agentId');

          if (taskToolUseIds.length > 0 && typeof entryAgentId === 'string' && sessionId) {
            for (const toolUseId of taskToolUseIds) {
              onAgentDetected({
                chatProcessId,
                toolUseId,
                agentId: agentIdContract.parse(entryAgentId),
                sessionId,
              });
            }
          }
        }

        if (output.type === 'patch') {
          onPatch({ chatProcessId, toolUseId: output.toolUseId, agentId: output.agentId });

          if (sessionId) {
            onAgentDetected({
              chatProcessId,
              toolUseId: output.toolUseId,
              agentId: output.agentId,
              sessionId,
            });
          }
        }
      }
    },
    onComplete: ({ exitCode, sessionId: extractedSessionId }) => {
      const finalSessionId = sessionId ?? extractedSessionId;

      if (resolvedQuestId && !sessionId && extractedSessionId && role === 'glyphsmith') {
        onDesignSessionLinked?.({ questId: resolvedQuestId, chatProcessId });
      }

      onComplete({ chatProcessId, exitCode: exitCode ?? null, sessionId: finalSessionId });
    },
  });

  // Stamp sessionId onto the chat work item as soon as it's extracted from the CLI init line.
  // This ensures the quest's work item has a sessionId before onComplete fires, so the
  // frontend's quest-modified WS filter can correlate events by sessionId.
  if (resolvedQuestId && !sessionId) {
    sessionId$
      .then(async (extractedSid) => {
        if (!extractedSid) return;
        const getResult = await questGetBroker({
          input: getQuestInputContract.parse({ questId: resolvedQuestId }),
        });
        if (!getResult.success || !getResult.quest) return;
        const chatItem = getResult.quest.workItems.find(
          (wi) => (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') && !wi.sessionId,
        );
        if (!chatItem) return;
        await questModifyBroker({
          input: {
            questId: resolvedQuestId,
            workItems: [{ id: chatItem.id, sessionId: sessionIdContract.parse(extractedSid) }],
          } as ModifyQuestInput,
        });
      })
      .catch((error: unknown) => {
        process.stderr.write(`[chat-spawn] session-id quest link failed: ${String(error)}\n`);
      });
  }

  registerProcess({ processId: chatProcessId, kill });

  return { chatProcessId };
};
