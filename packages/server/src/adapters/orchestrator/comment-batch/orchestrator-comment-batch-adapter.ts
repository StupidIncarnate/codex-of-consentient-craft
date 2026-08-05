/**
 * PURPOSE: Adapter for StartOrchestrator.commentBatch that wraps the orchestrator package
 *
 * USAGE:
 * const { chatProcessId, message } = await orchestratorCommentBatchAdapter({ guildId, sessionId, questId, comments });
 * // Returns: { chatProcessId, message } or throws when the quest write fails. `message` is the exact
 * // markdown turn the agent received, relayed to the browser so it can render the user's own entry.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

type CommentBatchParams = Parameters<typeof StartOrchestrator.commentBatch>[0];

export const orchestratorCommentBatchAdapter = async ({
  guildId,
  sessionId,
  questId,
  comments,
}: CommentBatchParams): Promise<Awaited<ReturnType<typeof StartOrchestrator.commentBatch>>> =>
  StartOrchestrator.commentBatch({ guildId, sessionId, questId, comments });
