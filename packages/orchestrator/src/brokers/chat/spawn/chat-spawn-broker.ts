/**
 * PURPOSE: Spawns a Claude CLI chat process for either ChaosWhisperer or Glyphsmith role with event emission for output streaming and lifecycle tracking
 *
 * USAGE:
 * const { chatProcessId } = await chatSpawnBroker({
 *   role: 'chaoswhisperer',
 *   guildId: GuildIdStub(),
 *   message: 'Help me build auth',
 *   processor,
 *   onEntries: ({ chatProcessId, entries }) => {},
 *   onAgentDetected: ({ chatProcessId, toolUseId, agentId, sessionId }) => {},
 *   onComplete: ({ chatProcessId, exitCode, sessionId }) => {},
 *   onSessionIdExtracted: ({ chatProcessId, sessionId }) => {},
 *   registerProcess: ({ processId, kill }) => {},
 * });
 * // Spawns Claude CLI with role-specific prompt, streams output via callbacks, returns chatProcessId
 */

import type { GuildId, QuestId, SessionId, WorkItemRole } from '@dungeonmaster/shared/contracts';
import {
  filePathContract,
  processIdContract,
  repoRootCwdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker, cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import { addQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { normalizedStreamLineContract } from '../../../contracts/normalized-stream-line/normalized-stream-line-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { isDesignPhaseQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questUserAddBroker } from '../../quest/user-add/quest-user-add-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

export const chatSpawnBroker = async ({
  role,
  guildId,
  questId,
  message,
  sessionId,
  processor,
  onEntries,
  onAgentDetected,
  onComplete,
  onQuestCreated,
  onDesignSessionLinked,
  onSessionIdExtracted,
  registerProcess,
}: {
  role: WorkItemRole;
  guildId: GuildId;
  questId?: QuestId;
  message: string;
  sessionId?: SessionId;
  processor: ChatLineProcessor;
  onEntries: (params: { chatProcessId: ProcessId; entries: ChatEntry[] }) => void;
  onAgentDetected: (params: {
    chatProcessId: ProcessId;
    toolUseId: ToolUseId;
    agentId: AgentId;
    sessionId: SessionId;
  }) => void;
  // onComplete may return a Promise; chat-spawn-broker fires it without awaiting (the
  // spawn-side teardown is already done at this point). chat-start-responder.onComplete
  // returns a promise because it awaits sub-agent tail drains before emitting
  // chat-complete on the bus.
  onComplete: (params: {
    chatProcessId: ProcessId;
    exitCode: number | null;
    sessionId: SessionId | null;
  }) => void | Promise<void>;
  onQuestCreated?: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  onDesignSessionLinked?: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  onSessionIdExtracted?: (params: { chatProcessId: ProcessId; sessionId: SessionId }) => void;
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
    if (!isDesignPhaseQuestStatusGuard({ status: questStatus })) {
      throw new Error(
        `Quest must be in a design phase (explore_design, review_design, or design_approved) to start design chat. Current status: ${questStatus}`,
      );
    }
    resolvedQuestId = questId;
  } else if (sessionId) {
    resolvedQuestId = questId ?? null;
  } else {
    const addInput = addQuestInputContract.parse({ title: 'New Quest', userRequest: message });
    const questResult = await questUserAddBroker({ input: addInput, guildId });
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

  if (role === 'ward') {
    throw new Error(
      `chatSpawnBroker cannot spawn role '${role}' — ward is a command, not a Claude agent`,
    );
  }

  // Walk up from the guild path to the repo root (directory containing `.dungeonmaster.json`)
  // so the spawned Claude CLI's cwd lets `.mcp.json` resolve its relative command. Falls back
  // to the guild path when no `.dungeonmaster.json` ancestor exists (standalone projects).
  const guildStartPath = filePathContract.parse(guild.path);
  const repoRootCwd = await (async () => {
    try {
      return await cwdResolveBroker({ startPath: guildStartPath, kind: 'repo-root' });
    } catch {
      return repoRootCwdContract.parse(guild.path);
    }
  })();

  // Runtime sessionId tracker. The `sessionId` parameter is set ONLY on resume — for a
  // fresh chat it's undefined until Claude CLI emits its `system/init` line carrying the
  // newly-allocated session_id. We update this closed-over variable as soon as any stream
  // line carries `sessionId`, so the `agent-detected` handler below can correlate even on
  // brand-new chats. Without this update, a `run_in_background` Task launched on the very
  // first turn of a new chat fires `agent-detected` before `sessionId` is known, the guard
  // below silently skips `onAgentDetected`, and the sub-agent tail is never started — the
  // chain renders `(0 entries)` for the entire life of the chat.
  let runtimeSessionId: SessionId | undefined = sessionId;

  const { kill, sessionId$ } = agentSpawnUnifiedBroker({
    prompt,
    cwd: repoRootCwd,
    model: roleToModelTransformer({ role }),
    ...(sessionId ? { resumeSessionId: sessionId } : {}),
    onLine: ({ line }) => {
      const subagentDebug = process.env.SUBAGENT_DEBUG === '1';
      if (subagentDebug) {
        process.stderr.write(`[SUBAGENT-TRACE][STDOUT-RAW] ${line}\n`);
      }
      const parsed = claudeLineNormalizeBroker({ rawLine: line });

      // Pick up sessionId synchronously per-line — system/init always arrives first
      // and carries `sessionId`, so by the time a Task tool_result line appears with
      // `tool_use_result.agentId`, runtimeSessionId is populated. Sync update avoids
      // racing the next `line` event before sessionId$ Promise observers have run.
      if (runtimeSessionId === undefined) {
        const sidParse = normalizedStreamLineContract.safeParse(parsed);
        if (sidParse.success) {
          const sid = sidParse.data.sessionId;
          if (typeof sid === 'string' && sid.length > 0) {
            runtimeSessionId = sessionIdContract.parse(sid);
          }
        }
      }

      const outputs = processor.processLine({
        parsed,
        source: sessionSource,
      });

      for (const output of outputs) {
        if (output.type === 'entries') {
          onEntries({ chatProcessId, entries: output.entries });

          if (subagentDebug) {
            for (const entry of output.entries) {
              const entryRole = entry.role;
              const entryType = 'type' in entry ? entry.type : 'n/a';
              const entryToolName = 'toolName' in entry ? entry.toolName : 'n/a';
              const entryToolUseId = 'toolUseId' in entry ? entry.toolUseId : 'n/a';
              const entryAgentIdVal = 'agentId' in entry ? entry.agentId : 'n/a';
              const entrySource = 'source' in entry ? entry.source : 'n/a';
              process.stderr.write(
                `[SUBAGENT-TRACE][STDOUT-ENTRY] role=${entryRole} type=${entryType} toolName=${entryToolName} toolUseId=${entryToolUseId} agentId=${entryAgentIdVal} source=${entrySource}\n`,
              );
            }
          }
        }

        // `agent-detected` is emitted when the processor learns the "real" internal agentId
        // from tool_use_result.agentId on the parent stream. That's the JSONL-filename key
        // we need to start `chatSubagentTailBroker`. The wire-level `agentId` on ChatEntries
        // is kept as `toolUseId` — sub-agent tail lines arrive without `parent_tool_use_id`
        // but the processor translates them into the same shape via its internal reverse map.
        if (output.type === 'agent-detected') {
          if (subagentDebug) {
            process.stderr.write(
              `[SUBAGENT-TRACE][STDOUT-AGENT-DETECTED] toolUseId=${String(output.toolUseId)} realAgentId=${String(output.agentId)} sessionId=${String(runtimeSessionId)}\n`,
            );
          }
          if (runtimeSessionId !== undefined) {
            onAgentDetected({
              chatProcessId,
              toolUseId: output.toolUseId,
              agentId: output.agentId,
              sessionId: runtimeSessionId,
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

      // The caller's onComplete may return a Promise (chat-start-responder's onComplete is
      // async because it awaits sub-agent tail drains before emitting chat-complete on the
      // bus). Fire-and-forget here — chat-spawn-broker has no further work to coordinate
      // with the caller's teardown. Promise.resolve normalises void-return into a thenable
      // so a single .catch handles either return shape lint-cleanly.
      Promise.resolve(
        onComplete({ chatProcessId, exitCode: exitCode ?? null, sessionId: finalSessionId }),
      ).catch((error: unknown) => {
        process.stderr.write(
          `chat-spawn-broker onComplete handler rejected: ${error instanceof Error ? error.message : String(error)}\n`,
        );
      });
    },
  });

  // Stamp sessionId onto the chat work item as soon as it's extracted from the CLI init line.
  // This ensures the quest's work item has a sessionId before onComplete fires, so the
  // frontend's quest-modified WS filter can correlate events by sessionId.
  // Also surface the sessionId to callers (for web URL update) via onSessionIdExtracted.
  if (!sessionId) {
    sessionId$
      .then(async (extractedSid) => {
        if (!extractedSid) return;
        const parsedSessionId = sessionIdContract.parse(extractedSid);
        onSessionIdExtracted?.({ chatProcessId, sessionId: parsedSessionId });
        if (!resolvedQuestId) return;
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
            workItems: [{ id: chatItem.id, sessionId: parsedSessionId }],
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
