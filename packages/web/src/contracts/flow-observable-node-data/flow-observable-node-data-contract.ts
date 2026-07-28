/**
 * PURPOSE: Defines the data shape for a React Flow assertion (observable) node — the small card
 * that branches off to the right of a flow node showing one acceptance criterion. Carries the
 * outcome type tag and the full description so a reviewer reads every assertion on the canvas
 * without opening a panel.
 *
 * USAGE:
 * flowObservableNodeDataContract.parse({ observableId: 'login-redirects', outcomeType: 'ui-state', description: 'redirects to dashboard', commentCount: 0, nodeId: 'login-page' });
 * // Returns: FlowObservableNodeData with branded fields
 */

import { z } from 'zod';

import {
  flowIdContract,
  flowNodeIdContract,
  observableIdContract,
  outcomeTypeContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';

import { commentCountContract } from '../comment-count/comment-count-contract';

export const flowObservableNodeDataContract = z.object({
  observableId: observableIdContract,
  outcomeType: outcomeTypeContract,
  description: z.string().brand<'FlowObservableNodeDescription'>(),
  // How many comments this card already carries. Gated INDEPENDENTLY of questId/flowId below — see
  // reactFlowNodeDataContract's commentCount field for the full rationale: the compose affordance
  // and the existing-comment record must never share one visibility flag.
  commentCount: commentCountContract,
  // The parent flow node this observable branches off, always set by the diagram widget (unlike
  // questId/flowId below, it is NOT part of the compose gate) so a comment on this card — or a click
  // on it in an approved, compose-disallowed quest — still resolves through its parent node.
  nodeId: flowNodeIdContract,
  // Anchor context for the comment COMPOSE affordance on this assertion card. Present only when the
  // comment compose controls are allowed for this quest; their absence is what makes the card
  // render no comment button.
  questId: questIdContract.optional(),
  flowId: flowIdContract.optional(),
});

export type FlowObservableNodeData = z.infer<typeof flowObservableNodeDataContract>;
