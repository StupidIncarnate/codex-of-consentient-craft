/**
 * PURPOSE: Spawns chaos/glyph agents from the orchestration loop. Delegates the spawn lifecycle to `agentLaunchBroker` so chat-from-loop launches identically to chat-from-server (chatSpawnBroker) and to every other orchestration agent. Builds the prompt via chatPromptBuildTransformer, resolves cwd, and forwards the launcher's onEntries to the loop's onAgentEntry. Writes sessionId + completion status back to the work item once the spawn exits.
 *
 * USAGE:
 * await runChatLayerBroker({ questId, workItem, guildId, userMessage, onAgentEntry });
 */

import {
  adapterResultContract,
  sessionIdContract,
  type AdapterResult,
  type ExitCode,
  type GuildId,
  type QuestId,
  type SessionId,
  type UserInput,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { processIdPrefixContract } from '../../../contracts/process-id-prefix/process-id-prefix-contract';
import { slotIndexContract } from '@dungeonmaster/shared/contracts';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentLaunchBroker } from '../../agent/launch/agent-launch-broker';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const runChatLayerBroker = async ({
  questId,
  workItem,
  guildId,
  userMessage,
  onAgentEntry,
}: {
  questId: QuestId;
  workItem: WorkItem;
  guildId: GuildId;
  userMessage?: UserInput;
  onAgentEntry: OnAgentEntryCallback;
}): Promise<AdapterResult> => {
  const slotIndex = slotIndexContract.parse(0);

  const prompt = chatPromptBuildTransformer({
    role: workItem.role,
    message: userMessage ?? '',
    questId,
    ...(workItem.sessionId === undefined ? {} : { sessionId: workItem.sessionId }),
  });

  if (workItem.role === 'ward') {
    throw new Error(
      `runChatLayerBroker cannot spawn role '${workItem.role}' — ward is a command, not a Claude agent`,
    );
  }

  const model = roleToModelTransformer({ role: workItem.role });

  // 'design' is glyphsmith's alone; every spec-intake role (chaoswhisperer, bughunt) is a chat.
  const processIdPrefix = processIdPrefixContract.parse(
    workItem.role === 'glyphsmith' ? 'design' : 'chat',
  );

  try {
    const resolution = await questCwdResolveBroker({ questId });

    if (resolution.kind === 'missing-worktree') {
      throw new Error(
        `Cannot start chat for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
      );
    }

    const resolvedCwd = resolution.cwd;

    const { sessionId, exitCode } = await new Promise<{
      sessionId: SessionId | null;
      exitCode: ExitCode | null;
    }>((resolve) => {
      let trackedSessionId: SessionId | null = null;
      agentLaunchBroker({
        guildId,
        processIdPrefix,
        prompt,
        cwd: resolvedCwd,
        model,
        ...(workItem.sessionId === undefined ? {} : { resumeSessionId: workItem.sessionId }),
        onEntries: ({ entries, sessionId: emittedSessionId }) => {
          onAgentEntry({
            slotIndex,
            entries,
            questWorkItemId: workItem.id,
            ...(emittedSessionId === undefined ? {} : { sessionId: emittedSessionId }),
          });
        },
        onText: (): void => {
          // Chat-layer no-op
        },
        onSignal: (): void => {
          // Chat-layer no-op
        },
        onSessionId: ({ sessionId: extractedSid }) => {
          trackedSessionId = extractedSid;
          onAgentEntry({
            slotIndex,
            entries: [],
            questWorkItemId: workItem.id,
            sessionId: extractedSid,
          });
        },
        onComplete: ({ exitCode: code, sessionId: completedSessionId }) => {
          resolve({
            sessionId: completedSessionId ?? trackedSessionId,
            exitCode: code,
          });
        },
      });
    });

    if (exitCode !== null && exitCode !== 0) {
      throw new Error(`Chat agent exited with code ${String(exitCode)}`);
    }

    if (sessionId) {
      await questModifyBroker({
        input: {
          questId,
          workItems: [{ id: workItem.id, sessionId: sessionIdContract.parse(sessionId) }],
        } as ModifyQuestInput,
      });
    }

    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItem.id,
            status: 'complete',
            completedAt: new Date().toISOString(),
          },
        ],
      } as ModifyQuestInput,
    });
    return adapterResultContract.parse({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItem.id,
            status: 'failed',
            completedAt: new Date().toISOString(),
            errorMessage: errorMsg,
          },
        ],
      } as ModifyQuestInput,
    });
    throw error;
  }
};
