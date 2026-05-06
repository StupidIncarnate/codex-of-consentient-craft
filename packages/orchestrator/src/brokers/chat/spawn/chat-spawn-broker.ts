/**
 * PURPOSE: Spawns a Claude CLI chat process for either ChaosWhisperer or Glyphsmith role with event emission for output streaming and lifecycle tracking. Resolves the quest + chat work item, builds the prompt, then delegates the full spawn lifecycle (chatStreamProcessHandleBroker, agentSpawnUnifiedBroker, chatMainSessionTailBroker, process registration) to `agentLaunchBroker` so chat agents launch identically to every orchestration-loop agent.
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

import {
  filePathContract,
  repoRootCwdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';
import type {
  ChatEntry,
  GuildId,
  ModifyQuestInput,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  SessionId,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import { processIdPrefixContract } from '../../../contracts/process-id-prefix/process-id-prefix-contract';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentLaunchBroker } from '../../agent/launch/agent-launch-broker';
import type { chatStreamProcessHandleBroker } from '../stream-process-handle/chat-stream-process-handle-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';
import { resolveChatQuestLayerBroker } from './resolve-chat-quest-layer-broker';

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
  registerProcess: (params: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId: QuestWorkItemId;
    kill: () => void;
  }) => void;
}): Promise<{
  chatProcessId: ProcessId;
  handle: ReturnType<typeof chatStreamProcessHandleBroker>;
}> => {
  if (role === 'ward') {
    throw new Error(
      `chatSpawnBroker cannot spawn role '${role}' — ward is a command, not a Claude agent`,
    );
  }

  const guild = await guildGetBroker({ guildId });

  const {
    questId: resolvedQuestId,
    workItemId: chatWorkItemId,
    createdQuest,
  } = await resolveChatQuestLayerBroker({
    role,
    guildId,
    ...(questId === undefined ? {} : { questId }),
    ...(sessionId === undefined ? {} : { sessionId }),
    message,
  });

  const prompt = chatPromptBuildTransformer({
    role,
    message,
    questId: resolvedQuestId,
    ...(sessionId ? { sessionId } : {}),
  });

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

  const launchResult = agentLaunchBroker({
    guildId,
    questId: resolvedQuestId,
    questWorkItemId: chatWorkItemId,
    processIdPrefix: processIdPrefixContract.parse(role === 'chaoswhisperer' ? 'chat' : 'design'),
    prompt,
    cwd: repoRootCwd,
    model: roleToModelTransformer({ role }),
    ...(sessionId ? { resumeSessionId: sessionId } : {}),
    onEntries,
    // Required by the harness invariant. Chat-side has no consumer for raw text capture
    // (entries carry the renderable content) or signal-back (chat agents don't signal
    // during interactive sessions). The non-empty body holds a comment so eslint's
    // no-empty-function rule is satisfied while the no-op semantics are preserved.
    onText: (): void => {
      // Chat-layer no-op
    },
    onSignal: (): void => {
      // Chat-layer no-op
    },
    onSessionId: ({ chatProcessId: cpid, sessionId: extractedSid }) => {
      // Only stamp on a fresh chaos session — caller-provided sessionId means the resume
      // path which already has the right sessionId on the work item.
      if (sessionId) return;
      onSessionIdExtracted?.({ chatProcessId: cpid, sessionId: extractedSid });
      questModifyBroker({
        input: {
          questId: resolvedQuestId,
          workItems: [{ id: chatWorkItemId, sessionId: sessionIdContract.parse(extractedSid) }],
        } as ModifyQuestInput,
      }).catch((error: unknown) => {
        process.stderr.write(`[chat-spawn] session-id quest link failed: ${String(error)}\n`);
      });
    },
    onComplete: ({ chatProcessId: cpid, exitCode, sessionId: extractedSessionId }) => {
      const finalSessionId = sessionId ?? extractedSessionId;
      if (!sessionId && extractedSessionId !== null && role === 'glyphsmith') {
        onDesignSessionLinked?.({ questId: resolvedQuestId, chatProcessId: cpid });
      }
      // The caller's onComplete may return a Promise (chat-start-responder.onComplete is
      // async because it awaits sub-agent tail drains before emitting chat-complete on the
      // bus). Fire-and-forget here — chat-spawn-broker has no further work to coordinate
      // with the caller's teardown. Promise.resolve normalizes void-return into a thenable.
      Promise.resolve(
        onComplete({ chatProcessId: cpid, exitCode: exitCode ?? null, sessionId: finalSessionId }),
      ).catch((error: unknown) => {
        process.stderr.write(
          `chat-spawn-broker onComplete handler rejected: ${error instanceof Error ? error.message : String(error)}\n`,
        );
      });
    },
    registerProcess: ({ processId: pid, questId: qId, questWorkItemId: wId, kill }) => {
      // Forward the launcher's full identity (processId, questId, questWorkItemId) to
      // the responder. The responder uses the workItemId to register per-work-item so
      // the resume path's `findByQuestWorkItemId` can locate this process and stop its
      // post-exit tail before the next turn writes to the same JSONL.
      registerProcess({
        processId: pid,
        questId: qId,
        questWorkItemId: wId,
        kill,
      });
    },
  });

  // Surface quest creation to the caller for the chaos-new path. Fired AFTER the launcher
  // has minted the chatProcessId so chat-start-responder can route on it.
  if (createdQuest) {
    onQuestCreated?.({ questId: resolvedQuestId, chatProcessId: launchResult.processId });
  }

  return { chatProcessId: launchResult.processId, handle: launchResult.handle };
};
