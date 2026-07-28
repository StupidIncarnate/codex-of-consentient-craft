/**
 * PURPOSE: Defines the data shape for a React Flow assertion (observable) node — the small card
 * that branches off to the right of a flow node showing one acceptance criterion. Carries the
 * outcome type tag and the full description so a reviewer reads every assertion on the canvas
 * without opening a panel.
 *
 * USAGE:
 * flowObservableNodeDataContract.parse({ observableId: 'login-redirects', outcomeType: 'ui-state', description: 'redirects to dashboard' });
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

export const flowObservableNodeDataContract = z.object({
  observableId: observableIdContract,
  outcomeType: outcomeTypeContract,
  description: z.string().brand<'FlowObservableNodeDescription'>(),
  // Anchor context for the comment affordance on this assertion card. `nodeId` is the parent flow
  // node this observable branches off, carried so an observable comment resolves through its parent.
  // questId and flowId are present only when the comment compose controls are allowed for this
  // quest; their absence is what makes the card render no comment button.
  nodeId: flowNodeIdContract.optional(),
  questId: questIdContract.optional(),
  flowId: flowIdContract.optional(),
});

export type FlowObservableNodeData = z.infer<typeof flowObservableNodeDataContract>;
