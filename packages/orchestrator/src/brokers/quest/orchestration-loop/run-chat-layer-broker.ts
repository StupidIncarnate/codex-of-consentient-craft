/**
 * PURPOSE: Spawns chaos/glyph agents with streaming, writes sessionId to work item
 *
 * USAGE:
 * await runChatLayerBroker({ questId, workItem, startPath, userMessage });
 * // Spawns chaos or glyph agent, writes sessionId and completion status back to quest
 */

import {
  adapterResultContract,
  filePathContract,
  repoRootCwdContract,
  sessionIdContract,
  type AdapterResult,
  type ExitCode,
  type FilePath,
  type QuestId,
  type SessionId,
  type UserInput,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker, cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const runChatLayerBroker = async ({
  questId,
  workItem,
  startPath,
  userMessage,
  onAgentEntry,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
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

  // Walk up from `startPath` to the repo root (directory containing `.dungeonmaster.json`)
  // so the spawned Claude CLI's cwd lets `.mcp.json` resolve. Falls back to startPath when
  // no `.dungeonmaster.json` ancestor exists (standalone projects, isolated /tmp dirs).
  const parsedStartPath = filePathContract.parse(startPath);
  const resolvedCwd = await (async () => {
    try {
      return await cwdResolveBroker({ startPath: parsedStartPath, kind: 'repo-root' });
    } catch {
      return repoRootCwdContract.parse(startPath);
    }
  })();

  try {
    const { sessionId, exitCode } = await new Promise<{
      sessionId: SessionId | null;
      exitCode: ExitCode | null;
    }>((resolve) => {
      let trackedSessionId: SessionId | null = null;

      agentSpawnUnifiedBroker({
        prompt,
        cwd: resolvedCwd,
        model,
        ...(workItem.sessionId === undefined ? {} : { resumeSessionId: workItem.sessionId }),
        onLine: ({ line }) => {
          onAgentEntry({
            slotIndex,
            entry: { raw: line },
            ...(trackedSessionId === null ? {} : { sessionId: trackedSessionId }),
          });

          if (trackedSessionId === null) {
            const parsed = claudeLineNormalizeBroker({ rawLine: line });
            const sid = sessionIdExtractorTransformer({ parsed });
            if (sid !== null) {
              trackedSessionId = sid;
            }
          }
        },
        onComplete: ({ exitCode: code }) => {
          resolve({ sessionId: trackedSessionId, exitCode: code });
        },
      });
    });

    if (exitCode !== null && exitCode !== 0) {
      throw new Error(`Chat agent exited with code ${String(exitCode)}`);
    }

    // Write sessionId back to work item
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
