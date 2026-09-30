/**
 * PURPOSE: Defines the QuestComment structure — one persisted user comment on a flow-diagram box, delivered to the LLM chat as a batch
 *
 * USAGE:
 * questCommentContract.parse({id: 'c0e3e17a-...', flowId: 'login-flow', nodeId: 'start', text: 'This assertion looks wrong', createdAt: '2024-...'});
 * // Returns: QuestComment object — one entry in quest.comments[]
 */

import { z } from '#gateway/npm/zod';

import { commentTextContract } from '../comment-text/comment-text-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { questCommentIdContract } from '../quest-comment-id/quest-comment-id-contract';
import { flowNodeContract } from '../flow-node/flow-node-contract';
import { flowContract } from '../flow/flow-contract';

export const questCommentContract = z.object({
  id: questCommentIdContract,
  flowId: flowContract.shape.id,
  // Stays required even when observableId is set, so an observable comment is findable from its
  // parent node — observables render as their own always-visible boxes branching right of the node.
  nodeId: flowNodeContract.shape.id,
  observableId: observableIdContract.optional(),
  text: commentTextContract,
  // The age of the text as it currently stands, not of the first draft — editing a queued comment
  // bumps this, and it is carried through the send so newest-first ordering matches authoring order.
  createdAt: z.iso.datetime().brand<'IsoTimestamp'>(),
});

export type QuestComment = z.infer<typeof questCommentContract>;
