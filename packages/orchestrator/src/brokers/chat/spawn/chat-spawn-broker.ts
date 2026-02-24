/**
 * PURPOSE: Spawns a Claude CLI chat process with event emission for output streaming and lifecycle tracking
 *
 * USAGE:
 * const { chatProcessId } = await chatSpawnBroker({
 *   guildId: GuildIdStub(),
 *   message: 'Help me build auth',
 *   onLine: ({ chatProcessId, line }) => {},
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
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { chaoswhispererPromptStatics } from '../../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { questSessionWriteLayerBroker } from './quest-session-write-layer-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questAddBroker } from '../../quest/add/quest-add-broker';

export const chatSpawnBroker = async ({
  guildId,
  message,
  sessionId,
  onLine,
  onComplete,
  registerProcess,
}: {
  guildId: GuildId;
  message: string;
  sessionId?: SessionId;
  onLine: (params: { chatProcessId: ProcessId; line: string }) => void;
  onComplete: (params: {
    chatProcessId: ProcessId;
    exitCode: number;
    sessionId: SessionId | null;
  }) => void;
  registerProcess: (params: { processId: ProcessId; kill: () => void }) => void;
}): Promise<{ chatProcessId: ProcessId }> => {
  const chatProcessId = processIdContract.parse(`chat-${crypto.randomUUID()}`);
  const guild = await guildGetBroker({ guildId });

  if (sessionId) {
    const prompt = promptTextContract.parse(message);
    const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter({
      prompt,
      resumeSessionId: sessionId,
      cwd: guild.path,
    });
    const rl = readlineCreateInterfaceAdapter({ input: stdout });

    rl.onLine(({ line }) => {
      onLine({ chatProcessId, line });
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
    onLine({ chatProcessId, line });

    if (!extractedSessionId) {
      const lineParseResult = streamJsonLineContract.safeParse(line);

      if (lineParseResult.success) {
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
