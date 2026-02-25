/**
 * PURPOSE: Spawns a Claude CLI chat process with event emission for output streaming and lifecycle tracking
 *
 * USAGE:
 * const { chatProcessId } = await chatSpawnBroker({
 *   guildId: GuildIdStub(),
 *   message: 'Help me build auth',
 *   onEntry: ({ chatProcessId, entry }) => {},
 *   onPatch: ({ chatProcessId, toolUseId, agentId }) => {},
 *   onAgentDetected: ({ chatProcessId, toolUseId, agentId }) => {},
 *   onComplete: ({ chatProcessId, exitCode, sessionId }) => {},
 *   registerProcess: ({ processId, kill }) => {},
 * });
 * // Spawns Claude CLI, streams output via callbacks, returns chatProcessId
 */

import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { readlineCreateInterfaceAdapter } from '../../../adapters/readline/create-interface/readline-create-interface-adapter';
import { addQuestInputContract } from '../../../contracts/add-quest-input/add-quest-input-contract';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { chaoswhispererPromptStatics } from '../../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { taskToolUseIdsFromContentTransformer } from '../../../transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { questSessionWriteLayerBroker } from './quest-session-write-layer-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questAddBroker } from '../../quest/add/quest-add-broker';

export const chatSpawnBroker = async ({
  guildId,
  message,
  sessionId,
  onEntry,
  onPatch,
  onAgentDetected,
  onComplete,
  registerProcess,
}: {
  guildId: GuildId;
  message: string;
  sessionId?: SessionId;
  onEntry: (params: { chatProcessId: ProcessId; entry: ChatLineEntry['entry'] }) => void;
  onPatch: (params: { chatProcessId: ProcessId; toolUseId: ToolUseId; agentId: AgentId }) => void;
  onAgentDetected: (params: {
    chatProcessId: ProcessId;
    toolUseId: ToolUseId;
    agentId: AgentId;
  }) => void;
  onComplete: (params: {
    chatProcessId: ProcessId;
    exitCode: number;
    sessionId: SessionId | null;
  }) => void;
  registerProcess: (params: { processId: ProcessId; kill: () => void }) => void;
}): Promise<{ chatProcessId: ProcessId }> => {
  const chatProcessId = processIdContract.parse(`chat-${crypto.randomUUID()}`);
  const guild = await guildGetBroker({ guildId });
  const processor = chatLineProcessTransformer();
  const sessionSource = chatLineSourceContract.parse('session');

  if (sessionId) {
    const prompt = promptTextContract.parse(message);
    const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter({
      prompt,
      resumeSessionId: sessionId,
      cwd: guild.path,
    });
    const rl = readlineCreateInterfaceAdapter({ input: stdout });

    rl.onLine(({ line }) => {
      const lineParseResult = streamJsonLineContract.safeParse(line);

      if (lineParseResult.success) {
        const outputs = processor.processLine({
          line: lineParseResult.data,
          source: sessionSource,
        });

        for (const output of outputs) {
          if (output.type === 'entry') {
            onEntry({ chatProcessId, entry: output.entry });

            const taskToolUseIds = taskToolUseIdsFromContentTransformer({ entry: output.entry });
            const entryAgentId: unknown = Reflect.get(output.entry, 'agentId');

            if (taskToolUseIds.length > 0 && typeof entryAgentId === 'string') {
              for (const toolUseId of taskToolUseIds) {
                onAgentDetected({ chatProcessId, toolUseId, agentId: entryAgentId as AgentId });
              }
            }
          }

          if (output.type === 'patch') {
            onPatch({ chatProcessId, toolUseId: output.toolUseId, agentId: output.agentId });
          }
        }
      }
    });

    childProcess.on('exit', (code) => {
      rl.close();
      onComplete({ chatProcessId, exitCode: code ?? 1, sessionId });
    });

    registerProcess({ processId: chatProcessId, kill: () => childProcess.kill() });

    return { chatProcessId };
  }

  const input = addQuestInputContract.parse({ title: 'New Quest', userRequest: message });
  const questResult = await questAddBroker({ input, guildId });

  if (!questResult.success || !questResult.questId) {
    throw new Error(`Failed to create quest: ${questResult.error ?? 'unknown'}`);
  }

  const { questId } = questResult;

  let promptText = chaoswhispererPromptStatics.prompt.template.replace(
    chaoswhispererPromptStatics.prompt.placeholders.arguments,
    message,
  );

  promptText = promptText.replace(chaoswhispererPromptStatics.prompt.placeholders.questId, questId);

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

          if (taskToolUseIds.length > 0 && typeof entryAgentId === 'string') {
            for (const toolUseId of taskToolUseIds) {
              onAgentDetected({ chatProcessId, toolUseId, agentId: entryAgentId as AgentId });
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
          questSessionWriteLayerBroker({ questId, sessionId: sid }).catch((error: unknown) => {
            process.stderr.write(
              `questSessionWriteLayerBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
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
