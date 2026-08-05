/**
 * PURPOSE: POSTs a queued comment batch to the per-quest comments endpoint and maps the response
 * into a typed outcome the queue bar widget branches on — sent (clear the queue), stale (prune
 * the named anchors), or failed (keep the whole queue for retry). Anchors and text only — no
 * labels — per #dd-browser-sends-anchors-server-resolves-labels: the server reads labels off the
 * quest itself.
 *
 * USAGE:
 * const result = await questCommentBatchBroker({ questId, comments });
 * // result.outcome === 'sent' | 'stale' | 'failed'
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostWithStatusAdapter } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter';
import { commentBatchResponseContract } from '../../../contracts/comment-batch-response/comment-batch-response-contract';
import { commentBatchSendResultContract } from '../../../contracts/comment-batch-send-result/comment-batch-send-result-contract';
import type { CommentBatchSendResult } from '../../../contracts/comment-batch-send-result/comment-batch-send-result-contract';
import type { CommentQueueEntry } from '../../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questCommentBatchBroker = async ({
  questId,
  comments,
}: {
  questId: QuestId;
  comments: readonly CommentQueueEntry[];
}): Promise<CommentBatchSendResult> => {
  const url = webConfigStatics.api.routes.questComments.replace(':questId', questId);

  const body = {
    comments: comments.map((entry) => ({
      flowId: entry.flowId,
      nodeId: entry.nodeId,
      ...(entry.observableId === undefined ? {} : { observableId: entry.observableId }),
      text: entry.text,
      createdAt: entry.createdAt,
    })),
  };

  const result = await fetchPostWithStatusAdapter({ url, body });
  const parsed = commentBatchResponseContract.safeParse(result.body);

  if (result.ok) {
    if (parsed.success && parsed.data.chatProcessId !== undefined) {
      return commentBatchSendResultContract.parse({
        outcome: 'sent',
        chatProcessId: parsed.data.chatProcessId,
        ...(parsed.data.deliveredMessage === undefined
          ? {}
          : { deliveredMessage: parsed.data.deliveredMessage }),
      });
    }
    // A 200 with no chatProcessId is a broken server contract, not a success.
    return commentBatchSendResultContract.parse({
      outcome: 'failed',
      error: `POST ${url} returned 200 with no chatProcessId`,
    });
  }

  if (result.status === httpStatusStatics.conflict) {
    if (
      parsed.success &&
      parsed.data.staleAnchors !== undefined &&
      parsed.data.staleAnchors.length > 0
    ) {
      return commentBatchSendResultContract.parse({
        outcome: 'stale',
        staleAnchors: parsed.data.staleAnchors,
      });
    }
    // A 409 that names no anchor cannot be pruned from — treating it as success would clear
    // comments the server never stored.
    return commentBatchSendResultContract.parse({
      outcome: 'failed',
      error: `POST ${url} returned 409 with no stale anchors`,
    });
  }

  const error =
    parsed.success && parsed.data.error !== undefined
      ? parsed.data.error
      : `POST ${url} failed with status ${result.status}`;

  return commentBatchSendResultContract.parse({ outcome: 'failed', error });
};
