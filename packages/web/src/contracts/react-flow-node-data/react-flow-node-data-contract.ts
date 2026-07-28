/**
 * PURPOSE: Defines the data shape for a React Flow node in the flow graph visualizer
 *
 * USAGE:
 * reactFlowNodeDataContract.parse({ nodeId: 'login-page', label: 'Login Page', nodeType: 'state', contractCount: 2, commentCount: 0 });
 * // Returns: ReactFlowNodeData with branded fields
 */

import { z } from 'zod';

import {
  flowIdContract,
  flowNodeIdContract,
  flowNodeTypeContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';

import { commentCountContract } from '../comment-count/comment-count-contract';
import { contractCountContract } from '../contract-count/contract-count-contract';

export const reactFlowNodeDataContract = z.object({
  nodeId: flowNodeIdContract,
  label: z.string().min(1).brand<'FlowNodeLabel'>(),
  nodeType: flowNodeTypeContract,
  contractCount: contractCountContract,
  // How many comments this card already carries. Gated INDEPENDENTLY of questId/flowId below:
  // COMMENT_COUNT_BADGE reports the existing comment record and renders in every quest status,
  // including approved, complete and the read-only execution panel, while questId/flowId gate only
  // the compose affordance — sharing one visibility flag would hide the badge exactly when the
  // review it captures becomes most worth reading.
  commentCount: commentCountContract,
  // Anchor context for the comment affordance on this card. Both are present only when the
  // comment compose controls are allowed for this quest (status precedes approved AND the quest
  // has a resumable chat session); their absence is what makes the card render no comment button.
  questId: questIdContract.optional(),
  flowId: flowIdContract.optional(),
});

export type ReactFlowNodeData = z.infer<typeof reactFlowNodeDataContract>;
