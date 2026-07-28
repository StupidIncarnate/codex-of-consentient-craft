/**
 * PURPOSE: Defines the data shape for a React Flow node in the flow graph visualizer
 *
 * USAGE:
 * reactFlowNodeDataContract.parse({ nodeId: 'login-page', label: 'Login Page', nodeType: 'state', contractCount: 2 });
 * // Returns: ReactFlowNodeData with branded fields
 */

import { z } from 'zod';

import {
  flowIdContract,
  flowNodeIdContract,
  flowNodeTypeContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';

import { contractCountContract } from '../contract-count/contract-count-contract';

export const reactFlowNodeDataContract = z.object({
  nodeId: flowNodeIdContract,
  label: z.string().min(1).brand<'FlowNodeLabel'>(),
  nodeType: flowNodeTypeContract,
  contractCount: contractCountContract,
  // Anchor context for the comment affordance on this card. Both are present only when the
  // comment compose controls are allowed for this quest (status precedes approved AND the quest
  // has a resumable chat session); their absence is what makes the card render no comment button.
  questId: questIdContract.optional(),
  flowId: flowIdContract.optional(),
});

export type ReactFlowNodeData = z.infer<typeof reactFlowNodeDataContract>;
