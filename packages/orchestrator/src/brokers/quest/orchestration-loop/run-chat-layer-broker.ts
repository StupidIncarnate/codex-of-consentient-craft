/**
 * PURPOSE: Spawns chaos/glyph agents with streaming, writes sessionId to work item
 *
 * USAGE:
 * await runChatLayerBroker({ questId, workItem, startPath, userMessage });
 * // Spawns chaos or glyph agent, writes sessionId and completion status back to quest
 */

import {
  absoluteFilePathContract,
  sessionIdContract,
  type ExitCode,
  type FilePath,
  type QuestId,
  type SessionId,
  type UserInput,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
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
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  const slotIndex = slotIndexContract.parse(0);

  const prompt = chatPromptBuildTransformer({
    role: workItem.role,
    message: userMessage ?? '',
    questId,
    ...(workItem.sessionId === undefined ? {} : { sessionId: workItem.sessionId }),
  });

  try {
    const { sessionId, exitCode } = await new Promise<{
      sessionId: SessionId | null;
      exitCode: ExitCode | null;
    }>((resolve) => {
      let trackedSessionId: SessionId | null = null;

      agentSpawnUnifiedBroker({
        prompt,
        cwd: absoluteFilePathContract.parse(startPath),
        ...(workItem.sessionId === undefined ? {} : { resumeSessionId: workItem.sessionId }),
        onLine: ({ line }) => {
          onAgentEntry?.({ slotIndex, entry: { raw: line } });

          if (trackedSessionId === null) {
            const parseResult = streamJsonLineContract.safeParse(line);
            if (parseResult.success) {
              const sid = sessionIdExtractorTransformer({ line: parseResult.data });
              if (sid !== null) {
                trackedSessionId = sid;
              }
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

    // Mark complete
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
