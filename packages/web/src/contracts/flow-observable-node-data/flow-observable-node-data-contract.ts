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

import { observableIdContract, outcomeTypeContract } from '@dungeonmaster/shared/contracts';

export const flowObservableNodeDataContract = z.object({
  observableId: observableIdContract,
  outcomeType: outcomeTypeContract,
  description: z.string().brand<'FlowObservableNodeDescription'>(),
});

export type FlowObservableNodeData = z.infer<typeof flowObservableNodeDataContract>;
