/**
 * PURPOSE: Persists a queued batch of flow-diagram comments onto the quest and hands back the
 * minted comments plus the quest's flows for the markdown transformer that builds the chat turn
 *
 * USAGE:
 * const { comments, flows } = await CommentBatchResponder({ questId, comments: batchEntries });
 * // Mints one QuestComment per entry, persists them via questModifyBroker, then reads quest.flows
 * // back so the caller can build the markdown message. Persist gates delivery — this throws on
 * // either a failed write or a failed post-persist read, so a chat turn is never fired for
 * // feedback the quest did not record.
 */

import { commentBatchResponderResultContract } from '../../../contracts/comment-batch-responder-result/comment-batch-responder-result-contract';
import type { CommentBatchResponderResult } from '../../../contracts/comment-batch-responder-result/comment-batch-responder-result-contract';
import { randomUUID } from '#gateway/node/crypto';
import type { CommentBatchEntry, QuestComment, Quest } from '@dungeonmaster/shared/contracts';
import {
  getQuestInputContract,
  modifyQuestInputContract,
  questCommentContract,
} from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';

export const CommentBatchResponder = async ({
  questId,
  comments,
}: {
  questId: Quest['id'];
  comments: CommentBatchEntry[];
}): Promise<CommentBatchResponderResult> => {
  const minted: QuestComment[] = comments.map((entry) =>
    questCommentContract.parse({
      id: randomUUID(),
      flowId: entry.flowId,
      nodeId: entry.nodeId,
      ...(entry.observableId === undefined ? {} : { observableId: entry.observableId }),
      text: entry.text,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    }),
  );

  const modifyResult = await questModifyBroker({
    input: modifyQuestInputContract.parse({ questId, comments: minted }),
  });

  if (!modifyResult.success) {
    throw new Error(`Failed to persist comment batch: ${modifyResult.error ?? 'unknown error'}`);
  }

  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });

  if (!getResult.success || !getResult.quest) {
    throw new Error(
      `Failed to load quest after persisting comment batch: ${getResult.error ?? 'unknown error'}`,
    );
  }

  return commentBatchResponderResultContract.parse({ comments: minted, flows: getResult.quest.flows });
};
