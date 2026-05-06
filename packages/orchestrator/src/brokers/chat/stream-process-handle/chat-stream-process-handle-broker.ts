/**
 * PURPOSE: Per-spawn handle that processes Claude CLI output lines through the converged chat-line processor — translating raw stdout/JSONL lines into ChatEntry batches, eagerly stamping sub-agent correlation, and dispatching `chatSubagentTailBroker` instances on every detected `agent-detected` signal so streaming and file sources for the same agent share one realAgentId↔toolUseId reverse map. Both the chat-spawn pipeline (chaoswhisperer / glyphsmith) and every orchestration-loop responder (pathseeker, codeweaver, lawbringer, siegemaster, spiritmender) wire their per-line callback through this broker so all four pipelines emit identical ChatEntry shapes. Plain-text lines (ward stdout, `spawnerType: 'command'`) bypass the processor and are wrapped in a single assistant-text ChatEntry.
 *
 * USAGE:
 * const handle = chatStreamProcessHandleBroker({
 *   chatProcessId,
 *   guildId,
 *   sessionId,
 *   onEntries: ({ chatProcessId, entries, sessionId }) => { },
 * });
 * agentSpawnUnifiedBroker({
 *   prompt,
 *   onLine: ({ line }) => handle.onLine({ rawLine: line }),
 * });
 * await handle.initialDrains();
 * handle.stop();
 */

import { chatEntryContract, sessionIdContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry, GuildId, ProcessId, SessionId } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { normalizedStreamLineContract } from '../../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { chatSubagentTailBroker } from '../subagent-tail/chat-subagent-tail-broker';

export const chatStreamProcessHandleBroker = ({
  chatProcessId,
  guildId,
  sessionId: initialSessionId,
  onEntries,
}: {
  chatProcessId: ProcessId;
  guildId: GuildId;
  sessionId?: SessionId;
  onEntries: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    sessionId: SessionId | undefined;
  }) => void;
}): {
  onLine: (params: { rawLine: string }) => void;
  stop: () => void;
  initialDrains: () => Promise<void>;
  // The shared processor instance — exposed so post-exit tails (e.g. `chatMainSessionTail
  // Broker`) can carry the same realAgentId↔toolUseId reverse map seamlessly across
  // streaming + post-exit JSONL appends. Architecture invariant: ONE processor per
  // session across every live source it has.
  processor: ChatLineProcessor;
} => {
  const processor = chatLineProcessTransformer();
  const sessionSource = chatLineSourceContract.parse('session');
  // Memoized once any line carrying it (typically system/init) is seen. The processor's
  // `agent-detected` handler below requires a sessionId to resolve the sub-agent JSONL
  // path before starting `chatSubagentTailBroker`; if the broker fires before init is
  // observed, the dispatch is silently skipped and the chain renders `(0 entries)`.
  let runtimeSessionId: SessionId | undefined = initialSessionId;

  const subagentHandles: { stop: () => void; initialDrain: Promise<void> }[] = [];
  // Fire-and-forget setups for sub-agent tails. `chatSubagentTailBroker` is async
  // (does mkdir + appendFile + fs.watch setup before returning). `initialDrains()`
  // awaits this set so callers can guarantee every detected sub-agent's pre-existing
  // JSONL drained to onEntries before they declare the spawn complete.
  const inflightSubagentSetups = new Set<Promise<void>>();

  return {
    onLine: ({ rawLine }: { rawLine: string }): void => {
      if (rawLine.length === 0) return;
      const parsed = claudeLineNormalizeBroker({ rawLine });

      // Plain-text fallback. Ward output (`spawnerType: 'command'`) emits non-JSON lines
      // that `claudeLineNormalizeBroker` rejects (returns `null`). Wrap each into a
      // single assistant-text ChatEntry so the web renders ward streaming verbatim.
      if (parsed === null) {
        const fallbackEntry = chatEntryContract.parse({
          role: 'assistant',
          type: 'text',
          content: rawLine,
          uuid: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        });
        onEntries({ chatProcessId, entries: [fallbackEntry], sessionId: runtimeSessionId });
        return;
      }

      // Pick up sessionId synchronously per-line. system/init arrives first and carries
      // `sessionId`, so by the time a Task tool_result line surfaces an agent-detected
      // signal, runtimeSessionId is populated. Sync update avoids racing the next line
      // event before any Promise observers have run.
      if (runtimeSessionId === undefined) {
        const sidParse = normalizedStreamLineContract.safeParse(parsed);
        if (sidParse.success) {
          const sid = sidParse.data.sessionId;
          if (typeof sid === 'string' && sid.length > 0) {
            runtimeSessionId = sessionIdContract.parse(sid);
          }
        }
      }

      const outputs = processor.processLine({ parsed, source: sessionSource });

      for (const output of outputs) {
        if (output.type === 'entries') {
          onEntries({
            chatProcessId,
            entries: output.entries,
            sessionId: runtimeSessionId,
          });
          continue;
        }

        if (runtimeSessionId !== undefined) {
          // The discriminated union has only `entries` and `agent-detected` variants; the
          // continue above narrowed `output` to `agent-detected`. Capture sid into a const
          // so the onEntries closure below doesn't reach back to `runtimeSessionId` (which
          // would trip no-loop-func).
          const sid: SessionId = runtimeSessionId;
          const realAgentId: AgentId = output.agentId;
          const setup = chatSubagentTailBroker({
            sessionId: sid,
            guildId,
            agentId: realAgentId,
            processor,
            chatProcessId,
            onEntries: ({ chatProcessId: cpid, entries }) => {
              onEntries({ chatProcessId: cpid, entries, sessionId: sid });
            },
          })
            .then((handle) => {
              subagentHandles.push(handle);
            })
            .catch((error: unknown) => {
              process.stderr.write(
                `chatSubagentTailBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
              );
            })
            .finally(() => {
              inflightSubagentSetups.delete(setup);
            });
          inflightSubagentSetups.add(setup);
        }
      }
    },
    stop: (): void => {
      for (const handle of subagentHandles) {
        handle.stop();
      }
      subagentHandles.length = 0;
    },
    initialDrains: async (): Promise<void> => {
      if (inflightSubagentSetups.size > 0) {
        await Promise.all(Array.from(inflightSubagentSetups));
      }
      if (subagentHandles.length > 0) {
        await Promise.all(subagentHandles.map(async (h) => h.initialDrain));
      }
    },
    processor,
  };
};
