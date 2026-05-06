/**
 * PURPOSE: Spawns chaos/glyph agents from the orchestration loop. Delegates the spawn lifecycle to `agentLaunchBroker` so chat-from-loop launches identically to chat-from-server (chatSpawnBroker) and to every other orchestration agent. Builds the prompt via chatPromptBuildTransformer, resolves cwd, and forwards the launcher's onEntries to the loop's onAgentEntry. Writes sessionId + completion status back to the work item once the spawn exits.
 *
 * USAGE:
 * await runChatLayerBroker({ questId, workItem, startPath, guildId, userMessage, onAgentEntry });
 */

import {
  adapterResultContract,
  filePathContract,
  repoRootCwdContract,
  sessionIdContract,
  type AdapterResult,
  type ExitCode,
  type FilePath,
  type GuildId,
  type QuestId,
  type SessionId,
  type UserInput,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { processIdPrefixContract } from '../../../contracts/process-id-prefix/process-id-prefix-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentLaunchBroker } from '../../agent/launch/agent-launch-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const runChatLayerBroker = async ({
  questId,
  workItem,
  startPath,
  guildId,
  userMessage,
  onAgentEntry,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
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

  const parsedStartPath = filePathContract.parse(startPath);
  const resolvedCwd = await (async () => {
    try {
      return await cwdResolveBroker({ startPath: parsedStartPath, kind: 'repo-root' });
    } catch {
      return repoRootCwdContract.parse(startPath);
    }
  })();

  const processIdPrefix = processIdPrefixContract.parse(
    workItem.role === 'chaoswhisperer' ? 'chat' : 'design',
  );

  try {
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
