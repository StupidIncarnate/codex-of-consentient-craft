/**
 * PURPOSE: Defines one queued comment as it travels browser -> comment-batch route -> orchestrator, before an id is minted at persist
 *
 * USAGE:
 * commentBatchEntryContract.parse({flowId: 'login-flow', nodeId: 'start', text: 'This assertion looks wrong'});
 * // Returns: CommentBatchEntry — one entry of the POST /api/quests/:questId/comments body
 *
 * WHEN-TO-USE: For the wire shape of a comment that has not been persisted yet
 * WHEN-NOT-TO-USE: For a persisted comment — that carries an id and lives under questCommentContract
 */

import { z } from 'zod';

import { commentTextContract } from '../comment-text/comment-text-contract';
import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';

export const commentBatchEntryContract = z.object({
  flowId: flowIdContract,
  // Carried even for an observable comment, so the anchor resolves through its parent node.
  nodeId: flowNodeIdContract,
  observableId: observableIdContract.optional(),
  text: commentTextContract,
  // Optional: the browser carries the queue entry's own createdAt so newest-first ordering matches
  // authoring order rather than persist order, and the persist mints one when it is absent.
  createdAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
});

export type CommentBatchEntry = z.infer<typeof commentBatchEntryContract>;
