/**
 * PURPOSE: Defines one entry of the 409 comment-batch response's staleAnchors array — a queued comment's
 * anchor that no longer resolves against quest.flows
 *
 * USAGE:
 * commentStaleAnchorContract.parse({flowId: 'login-flow', nodeId: 'start'});
 * // Returns: CommentStaleAnchor — one anchor the browser drops from its queue
 */

import { z } from 'zod';

import {
  flowIdContract,
  flowNodeIdContract,
  observableIdContract,
} from '@dungeonmaster/shared/contracts';

export const commentStaleAnchorContract = z.object({
  flowId: flowIdContract,
  nodeId: flowNodeIdContract,
  observableId: observableIdContract.optional(),
});

export type CommentStaleAnchor = z.infer<typeof commentStaleAnchorContract>;
