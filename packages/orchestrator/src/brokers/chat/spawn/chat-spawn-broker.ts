/**
 * PURPOSE: Spawns a Claude CLI chat process for either ChaosWhisperer or Glyphsmith role with event emission for output streaming and lifecycle tracking. The per-line stream is funneled through `chatStreamProcessHandleBroker` so sub-agent convergence (eager toolUseId stamping, source tagging, JSONL tail dispatch) is identical to every other agent spawn pipeline in the orchestrator.
 *
 * USAGE:
 * const { chatProcessId, handle } = await chatSpawnBroker({
 *   role: 'chaoswhisperer',
 *   guildId: GuildIdStub(),
 *   message: 'Help me build auth',
 *   onEntries: ({ chatProcessId, entries, sessionId }) => {},
 *   onComplete: ({ chatProcessId, exitCode, sessionId }) => {},
 *   onSessionIdExtracted: ({ chatProcessId, sessionId }) => {},
 *   registerProcess: ({ processId, kill }) => {},
 * });
 * // `handle` exposes stop() + initialDrains() for chat lifecycle composition.
 */

import type { GuildId, QuestId, SessionId, WorkItemRole } from '@dungeonmaster/shared/contracts';
import {
  filePathContract,
  processIdContract,
  repoRootCwdContract,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { addQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { isDesignPhaseQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { chatStreamProcessHandleBroker } from '../stream-process-handle/chat-stream-process-handle-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questUserAddBroker } from '../../quest/user-add/quest-user-add-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';
import { sessionIdContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

export const chatSpawnBroker = async ({
  role,
  guildId,
  questId,
  message,
  sessionId,
  onEntries,
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
  onEntries: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    sessionId: SessionId | undefined;
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
}): Promise<{
  chatProcessId: ProcessId;
  handle: ReturnType<typeof chatStreamProcessHandleBroker>;
}> => {
  const prefix = role === 'chaoswhisperer' ? 'chat' : 'design';
  const chatProcessId = processIdContract.parse(`${prefix}-${crypto.randomUUID()}`);
  const guild = await guildGetBroker({ guildId });

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

  // The handle owns the per-line processor pipeline: ChatEntry batching, sub-agent
  // convergence, and JSONL tail dispatch. Created BEFORE agentSpawnUnifiedBroker so the
  // onLine callback below can forward straight into it.
  const handle = chatStreamProcessHandleBroker({
    chatProcessId,
    guildId,
    ...(sessionId ? { sessionId } : {}),
    onEntries,
  });

  const { kill, sessionId$ } = agentSpawnUnifiedBroker({
    prompt,
    cwd: repoRootCwd,
    model: roleToModelTransformer({ role }),
    ...(sessionId ? { resumeSessionId: sessionId } : {}),
    onLine: ({ line }) => {
      handle.onLine({ rawLine: line });
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

  return { chatProcessId, handle };
};
