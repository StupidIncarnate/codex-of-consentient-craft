/**
 * PURPOSE: Spawns a Claude CLI design chat process for UI prototyping with the Glyphsmith agent
 *
 * USAGE:
 * const { chatProcessId } = await designChatSpawnBroker({
 *   guildId: GuildIdStub(),
 *   questId: QuestIdStub(),
 *   message: 'Create login page prototype',
 *   processor,
 *   onEntry: ({ chatProcessId, entry }) => {},
 *   onPatch: ({ chatProcessId, toolUseId, agentId }) => {},
 *   onAgentDetected: ({ chatProcessId, toolUseId, agentId, sessionId }) => {},
 *   onComplete: ({ chatProcessId, exitCode, sessionId }) => {},
 *   onDesignSessionLinked: ({ questId, chatProcessId }) => {},
 *   registerProcess: ({ processId, kill }) => {},
 * });
 * // Spawns Claude CLI with Glyphsmith prompt, streams output via callbacks, returns chatProcessId
 */

import type { GuildId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { readlineCreateInterfaceAdapter } from '../../../adapters/readline/create-interface/readline-create-interface-adapter';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { glyphsmithPromptStatics } from '../../../statics/glyphsmith-prompt/glyphsmith-prompt-statics';
import { questStatics } from '../../../statics/quest/quest-statics';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { taskToolUseIdsFromContentTransformer } from '../../../transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { designSessionWriteLayerBroker } from './design-session-write-layer-broker';

export const designChatSpawnBroker = async ({
  guildId,
  questId,
  message,
  processor,
  onEntry,
  onPatch,
  onAgentDetected,
  onComplete,
  onDesignSessionLinked,
  registerProcess,
}: {
  guildId: GuildId;
  questId: QuestId;
  message: string;
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
    exitCode: number;
    sessionId: SessionId | null;
  }) => void;
  onDesignSessionLinked?: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  registerProcess: (params: { processId: ProcessId; kill: () => void }) => void;
}): Promise<{ chatProcessId: ProcessId }> => {
  const chatProcessId = processIdContract.parse(`design-${crypto.randomUUID()}`);
  const guild = await guildGetBroker({ guildId });
  const sessionSource = chatLineSourceContract.parse('session');

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

  let promptText = glyphsmithPromptStatics.prompt.template.replace(
    glyphsmithPromptStatics.prompt.placeholders.arguments,
    message,
  );

  promptText = promptText.replace(glyphsmithPromptStatics.prompt.placeholders.questId, questId);

  const prompt = promptTextContract.parse(promptText);

  const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter({
    prompt,
    cwd: guild.path,
  });
  const rl = readlineCreateInterfaceAdapter({ input: stdout });

  let extractedSessionId: SessionId | null = null;

  rl.onLine(({ line }) => {
    const lineParseResult = streamJsonLineContract.safeParse(line);

    if (lineParseResult.success) {
      const outputs = processor.processLine({ line: lineParseResult.data, source: sessionSource });

      for (const output of outputs) {
        if (output.type === 'entry') {
          onEntry({ chatProcessId, entry: output.entry });

          const taskToolUseIds = taskToolUseIdsFromContentTransformer({ entry: output.entry });
          const entryAgentId: unknown = Reflect.get(output.entry, 'agentId');

          if (taskToolUseIds.length > 0 && typeof entryAgentId === 'string' && extractedSessionId) {
            for (const toolUseId of taskToolUseIds) {
              onAgentDetected({
                chatProcessId,
                toolUseId,
                agentId: entryAgentId as AgentId,
                sessionId: extractedSessionId,
              });
            }
          }
        }

        if (output.type === 'patch') {
          onPatch({ chatProcessId, toolUseId: output.toolUseId, agentId: output.agentId });
        }
      }

      if (!extractedSessionId) {
        const sid = sessionIdExtractorTransformer({ line: lineParseResult.data });

        if (sid) {
          extractedSessionId = sid;
          onDesignSessionLinked?.({ questId, chatProcessId });
          designSessionWriteLayerBroker({ questId, sessionId: sid }).catch((error: unknown) => {
            process.stderr.write(
              `designSessionWriteLayerBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
            );
          });
        }
      }
    }
  });

  childProcess.on('exit', (code) => {
    rl.close();
    onComplete({ chatProcessId, exitCode: code ?? 1, sessionId: extractedSessionId });
  });

  registerProcess({ processId: chatProcessId, kill: () => childProcess.kill() });

  return { chatProcessId };
};
