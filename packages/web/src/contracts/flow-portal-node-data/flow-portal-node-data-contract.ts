/**
 * PURPOSE: Defines the data shape for a React Flow "portal" node — the stand-in card the flow
 * diagram renders for an edge that points into ANOTHER flow (a `flowId:nodeId` cross-flow
 * reference). Carries the raw cross-flow reference (used verbatim as the React Flow node id so the
 * edge resolves to it) and a human label so the reviewer sees which flow/node the edge hands off to.
 *
 * USAGE:
 * flowPortalNodeDataContract.parse({ reference: 'compile-flow:compile-entry', label: '↗ compile-flow → compile-entry' });
 * // Returns: FlowPortalNodeData with branded fields
 */

import { z } from '#gateway/npm/zod';


export const flowPortalNodeDataContract = z.object({
  reference: z.string().min(1).brand<'FlowPortalNodeDataReference'>(),
  label: z.string().min(1).brand<'FlowPortalNodeLabel'>(),
});

export type FlowPortalNodeData = z.infer<typeof flowPortalNodeDataContract>;
