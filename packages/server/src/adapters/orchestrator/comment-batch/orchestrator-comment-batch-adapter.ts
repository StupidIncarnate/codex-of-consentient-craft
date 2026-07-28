/**
 * PURPOSE: Adapter for StartOrchestrator.commentBatch that wraps the orchestrator package
 *
 * USAGE:
 * const { chatProcessId } = await orchestratorCommentBatchAdapter({ guildId, sessionId, questId, comments });
 * // Returns: { chatProcessId: ProcessId } or throws when the quest write fails
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

type CommentBatchParams = Parameters<typeof StartOrchestrator.commentBatch>[0];

export const orchestratorCommentBatchAdapter = async ({
  guildId,
  sessionId,
  questId,
  comments,
}: CommentBatchParams): Promise<{ chatProcessId: ProcessId }> =>
  StartOrchestrator.commentBatch({ guildId, sessionId, questId, comments });
