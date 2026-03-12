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

import type { GuildId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract, processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { agentIdContract } from '../../../contracts/agent-id/agent-id-contract';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import type { ChatRole } from '../../../contracts/chat-role/chat-role-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { taskToolUseIdsFromContentTransformer } from '../../../transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { designSessionWriteLayerBroker } from './design-session-write-layer-broker';
import { questSessionWriteLayerBroker } from './quest-session-write-layer-broker';
import { resolveQuestLayerBroker } from './resolve-quest-layer-broker';

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
  role: ChatRole;
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

  const resolvedQuestId = await resolveQuestLayerBroker({
    role,
    message,
    guildId,
    chatProcessId,
    ...(questId ? { questId } : {}),
    ...(sessionId ? { sessionId } : {}),
    ...(onQuestCreated ? { onQuestCreated } : {}),
  });

  const prompt = chatPromptBuildTransformer({
    role,
    message,
    questId: resolvedQuestId,
    ...(sessionId ? { sessionId } : {}),
  });

  const { kill } = agentSpawnUnifiedBroker({
    prompt,
    cwd: absoluteFilePathContract.parse(guild.path),
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
        }
      }
    },
    onComplete: ({ exitCode, sessionId: extractedSessionId }) => {
      const finalSessionId = sessionId ?? extractedSessionId;

      if (resolvedQuestId && !sessionId && extractedSessionId) {
        if (role === 'chaoswhisperer') {
          questSessionWriteLayerBroker({
            questId: resolvedQuestId,
            sessionId: extractedSessionId,
          }).catch((error: unknown) => {
            process.stderr.write(
              `questSessionWriteLayerBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
            );
          });
        }

        if (role === 'glyphsmith') {
          onDesignSessionLinked?.({ questId: resolvedQuestId, chatProcessId });
          designSessionWriteLayerBroker({
            questId: resolvedQuestId,
            sessionId: extractedSessionId,
          }).catch((error: unknown) => {
            process.stderr.write(
              `designSessionWriteLayerBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
            );
          });
        }
      }

      onComplete({ chatProcessId, exitCode: exitCode ?? null, sessionId: finalSessionId });
    },
  });

  registerProcess({ processId: chatProcessId, kill });

  return { chatProcessId };
};
