/**
 * PURPOSE: Defines the edge-routing output of the ELK layout adapter — an ordered list of points
 * (start, bend points, end) per edge id, in the same coordinate space as the node positions. ELK's
 * layered algorithm routes every edge AROUND the nodes, so rendering an edge along these points
 * keeps it clear of intervening cards without any hand-rolled detour maths.
 *
 * USAGE:
 * flowEdgeRouteMapContract.parse({ 'e1': [{ x: 0, y: 0 }, { x: 0, y: 60 }, { x: 120, y: 60 }] });
 * // Returns: FlowEdgeRouteMap keyed by edge id with branded x/y route points
 */

import { z } from 'zod';

const routePointContract = z.object({
  x: z.number().brand<'ElkRouteX'>(),
  y: z.number().brand<'ElkRouteY'>(),
});

export const flowEdgeRouteMapContract = z
  .record(z.string(), z.array(routePointContract))
  .brand<'FlowEdgeRouteMap'>();

export type FlowEdgeRouteMap = z.infer<typeof flowEdgeRouteMapContract>;
