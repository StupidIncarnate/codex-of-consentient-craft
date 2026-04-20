/**
 * PURPOSE: Tails a subagent's JSONL file in real-time and feeds lines through a shared processor instance, dispatching fully-parsed ChatEntry arrays via callbacks. Relies on the processor's realAgentId→toolUseId translation map (populated by user tool_result lines on the parent stream) to stamp sub-agent lines with the correct `parent_tool_use_id` — so they converge on the same wire shape as streaming-source lines.
 *
 * USAGE:
 * const stop = chatSubagentTailBroker({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   guildId: GuildIdStub({ value: 'f47ac10b-...' }),
 *   agentId: AgentIdStub({ value: 'agent-1' }),
 *   processor: chatLineProcessTransformer(),
 *   onEntries: ({ chatProcessId, entries }) => { },
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
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { guildGetBroker } from '../../guild/get/guild-get-broker';

export const chatSubagentTailBroker = async ({
  sessionId,
  guildId,
  agentId,
  processor,
  onEntries,
  chatProcessId,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  agentId: AgentId;
  processor: ChatLineProcessor;
  onEntries: (params: { chatProcessId: ProcessId; entries: ChatEntry[] }) => void;
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

  const subagentDebug = process.env.SUBAGENT_DEBUG === '1';
  if (subagentDebug) {
    process.stderr.write(
      `[SUBAGENT-TRACE][SUBAGENT-TAIL-OPEN] agentId=${String(agentId)} path=${String(subagentJsonlPath)}\n`,
    );
  }
  const handle = fsWatchTailAdapter({
    filePath: subagentJsonlPath,
    onLine: ({ line }) => {
      if (subagentDebug) {
        process.stderr.write(`[SUBAGENT-TRACE][SUBAGENT-RAW] agentId=${String(agentId)} ${line}\n`);
      }
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: subagentSource,
        agentId,
      });

      for (const output of outputs) {
        if (output.type === 'entries') {
          if (subagentDebug) {
            for (const entry of output.entries) {
              const entryRole = entry.role;
              const entryType = 'type' in entry ? entry.type : 'n/a';
              const entryToolName = 'toolName' in entry ? entry.toolName : 'n/a';
              const entryAgentIdVal = 'agentId' in entry ? entry.agentId : 'n/a';
              const entrySource = 'source' in entry ? entry.source : 'n/a';
              process.stderr.write(
                `[SUBAGENT-TRACE][SUBAGENT-ENTRY] agentId=${agentId} role=${entryRole} type=${entryType} toolName=${entryToolName} entryAgentId=${entryAgentIdVal} source=${entrySource}\n`,
              );
            }
          }
          onEntries({ chatProcessId, entries: output.entries });
        }
        // `agent-detected` outputs are consumed upstream by chat-spawn-broker; the tail
        // only forwards ChatEntry batches to the renderer.
      }
    },
    onError: () => {
      // Errors during tail are non-fatal; the watcher will retry on next change
    },
  });

  return handle.stop;
};
