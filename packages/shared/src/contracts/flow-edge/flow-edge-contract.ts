/**
 * PURPOSE: Defines the FlowEdge structure for edges connecting flow nodes
 *
 * USAGE:
 * flowEdgeContract.parse({id: 'login-to-dashboard', from: 'login-page', to: 'dashboard', label: 'success'});
 * // Returns: FlowEdge object
 */

import { z } from '#gateway/npm/zod';


export const flowEdgeContract = z.object({
  id: z.string().min(1).regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u).brand<'FlowEdgeId'>(),
  from: z.string().min(1).brand<'FlowEdgeFrom'>(),
  to: z.string().min(1).brand<'FlowEdgeTo'>(),
  label: z.string().brand<'FlowEdgeLabel'>().optional(),
});

export type FlowEdge = z.infer<typeof flowEdgeContract>;
