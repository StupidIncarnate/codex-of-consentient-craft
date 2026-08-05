/**
 * PURPOSE: Handles a queued comment batch — validates the body, resolves the chat sessionId the way the clarify responder does, resolves every anchor against the quest, then delegates to the orchestrator comment-batch adapter
 *
 * USAGE:
 * const result = await QuestCommentBatchResponder({ params: { questId }, body: { comments } });
 * // Returns { status: 200, data: { chatProcessId } }, or { status: 400/404/500, data: { error } },
 * // or { status: 409, data: { error, staleAnchors } } naming every anchor that no longer resolves
 */

import { isChatWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { orchestratorCommentBatchAdapter } from '../../../adapters/orchestrator/comment-batch/orchestrator-comment-batch-adapter';
import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { commentBatchBodyContract } from '../../../contracts/comment-batch-body/comment-batch-body-contract';
import { commentBatchResponseContract } from '../../../contracts/comment-batch-response/comment-batch-response-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { commentBatchStaleAnchorsTransformer } from '../../../transformers/comment-batch-stale-anchors/comment-batch-stale-anchors-transformer';

export const QuestCommentBatchResponder = async ({
  params,
  body,
}: {
  params: unknown;
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }

    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }
    const { questId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = commentBatchBodyContract.safeParse(body);
    if (!parsedBody.success) {
      // An issue whose path is exactly ['comments'] is about the ARRAY itself — absent, not an
      // array, or empty. A malformed entry reports a deeper path (['comments', 0, 'flowId']), which
      // deserves its own message rather than being mislabelled as an empty batch.
      const isArrayLevelFailure = parsedBody.error.issues.some(
        (issue) => issue.path.length === 1 && issue.path[0] === 'comments',
      );
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: {
          error: isArrayLevelFailure
            ? 'comments array is required and must not be empty'
            : 'Each comment must carry a valid flowId, nodeId and text',
        },
      });
    }
    const { comments } = parsedBody.data;

    const quest = await orchestratorLoadQuestAdapter({ questId });

    const chatItem = quest.workItems.find(
      (wi) => isChatWorkItemRoleGuard({ role: wi.role }) && wi.sessionId,
    );
    const resolvedSessionId = chatItem?.sessionId;

    if (!resolvedSessionId) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.notFound,
        data: { error: 'No active chat session found for quest' },
      });
    }

    // Resolving the anchor doubles as validation: a comment naming a box an agent turn deleted is
    // rejected rather than persisted against a dead id. The 409 ENUMERATES every offender because
    // the browser prunes exactly those queue entries and cannot do so from a bare status code —
    // the anchor is gone permanently, so a bare rejection would reproduce the same 409 forever.
    const staleAnchors = commentBatchStaleAnchorsTransformer({ comments, flows: quest.flows });
    if (staleAnchors.length > 0) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.conflict,
        data: { error: 'Comment anchor no longer exists on the quest', staleAnchors },
      });
    }

    const { guildId } = await orchestratorFindQuestPathAdapter({ questId });

    const { chatProcessId, message } = await orchestratorCommentBatchAdapter({
      guildId,
      sessionId: resolvedSessionId,
      questId,
      comments,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      // `deliveredMessage` is the markdown the agent actually received. The browser renders it as
      // the user's own chat entry; Claude's --resume stream never echoes the prompt, so without
      // this the sent batch is invisible until a reload replays the session from disk.
      data: commentBatchResponseContract.parse({ chatProcessId, deliveredMessage: message }),
    });
  } catch (error: unknown) {
    // Persist gates delivery: the orchestrator flow throws when the quest write fails, so a 500
    // here means nothing was persisted AND no chat process was spawned. The browser keeps its
    // localStorage queue until it sees a 200, so the batch stays retryable.
    const errorMessage = error instanceof Error ? error.message : 'Failed to process comment batch';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: errorMessage },
    });
  }
};
