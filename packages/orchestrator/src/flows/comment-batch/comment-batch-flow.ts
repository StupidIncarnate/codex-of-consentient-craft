/**
 * PURPOSE: Orchestrates a queued comment batch by persisting the comments then resuming the chat session with the markdown batch
 *
 * USAGE:
 * const { chatProcessId } = await CommentBatchFlow({ guildId, sessionId, questId, comments });
 * // Persists the batch onto quest.comments, builds the agent-facing markdown from the post-persist
 * // flows, then resumes the agent via ChatStartResponder
 */

import type {
  CommentBatchEntry,
  GuildId,
  ProcessId,
  QuestId,
  SessionId,
} from '@dungeonmaster/shared/contracts';

import { ChatStartResponder } from '../../responders/chat/start/chat-start-responder';
import { CommentBatchResponder } from '../../responders/comment/batch/comment-batch-responder';
import { commentBatchToMarkdownTransformer } from '../../transformers/comment-batch-to-markdown/comment-batch-to-markdown-transformer';

export const CommentBatchFlow = async ({
  guildId,
  sessionId,
  questId,
  comments,
}: {
  guildId: GuildId;
  sessionId: SessionId;
  questId: QuestId;
  comments: CommentBatchEntry[];
}): Promise<{ chatProcessId: ProcessId }> => {
  // Persist gates delivery, mirroring the clarify flow's ordering exactly: the responder throws
  // when the quest write fails, so the markdown is never built and no chat process is ever spawned
  // for feedback the quest does not record. The browser holds its localStorage queue until it sees
  // a success response, so a failure here leaves the batch intact for a retry.
  const { comments: persisted, flows } = await CommentBatchResponder({ questId, comments });

  // Only the comments in THIS batch are rendered — previously sent comments are never replayed, so
  // the agent reads exactly the new feedback rather than a growing history. Labels come off the
  // post-persist flows, never off the request body.
  const message = commentBatchToMarkdownTransformer({ comments: persisted, flows });

  return ChatStartResponder({ guildId, message, sessionId });
};
