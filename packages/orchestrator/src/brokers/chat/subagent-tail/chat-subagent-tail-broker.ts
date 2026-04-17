/**
 * PURPOSE: Tails a subagent's JSONL file in real-time and feeds lines through a shared processor instance, dispatching fully-parsed ChatEntry arrays and patches via callbacks
 *
 * USAGE:
 * const stop = chatSubagentTailBroker({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   guildId: GuildIdStub({ value: 'f47ac10b-...' }),
 *   agentId: AgentIdStub({ value: 'agent-1' }),
 *   processor: chatLineProcessTransformer(),
 *   onEntries: ({ chatProcessId, entries }) => { },
 *   onPatch: ({ chatProcessId, toolUseId, agentId }) => { },
 *   chatProcessId: ProcessIdStub({ value: 'proc-123' }),
 * });
 * // Returns a stop function that ends the tail
 */

import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry, GuildId, SessionId } from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';

import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLinePatch } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { guildGetBroker } from '../../guild/get/guild-get-broker';

export const chatSubagentTailBroker = async ({
  sessionId,
  guildId,
  agentId,
  processor,
  onEntries,
  onPatch,
  chatProcessId,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  agentId: AgentId;
  processor: ChatLineProcessor;
  onEntries: (params: { chatProcessId: ProcessId; entries: ChatEntry[] }) => void;
  onPatch: (params: {
    chatProcessId: ProcessId;
    toolUseId: ChatLinePatch['toolUseId'];
    agentId: ChatLinePatch['agentId'];
  }) => void;
  chatProcessId: ProcessId;
}): Promise<() => void> => {
  const guild = await guildGetBroker({ guildId });
  const projectPath = absoluteFilePathContract.parse(guild.path);
  const homeDir = osUserHomedirAdapter();

  const jsonlPath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  const subagentJsonlPath = absoluteFilePathContract.parse(
    `${stripJsonlSuffixTransformer({ filePath: jsonlPath })}/subagents/agent-${agentId}.jsonl`,
  );

  const subagentSource = chatLineSourceContract.parse('subagent');

  const handle = fsWatchTailAdapter({
    filePath: subagentJsonlPath,
    onLine: ({ line }) => {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: subagentSource,
        agentId,
      });

      for (const output of outputs) {
        if (output.type === 'entries') {
          onEntries({ chatProcessId, entries: output.entries });
        }
        if (output.type === 'patch') {
          onPatch({
            chatProcessId,
            toolUseId: output.toolUseId,
            agentId: output.agentId,
          });
        }
      }
    },
    onError: () => {
      // Errors during tail are non-fatal; the watcher will retry on next change
    },
  });

  return handle.stop;
};
