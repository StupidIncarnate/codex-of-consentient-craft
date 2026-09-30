/**
 * PURPOSE: Defines the WidgetEdges structure — outgoing edges from a widget file in the
 * widget composition graph (child widget paths and binding names)
 *
 * USAGE:
 * const edges: WidgetEdges = { childWidgetPaths: [], bindingNames: [] };
 *
 * WHEN-TO-USE: Passing edge data between extractWidgetEdgesLayerBroker and buildWidgetNodeLayerBroker
 */

import { z } from '#gateway/npm/zod';

export const widgetEdgesContract = z.object({
  childWidgetPaths: z.array(z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'WidgetEdgesChildWidgetPaths'>()),
  bindingNames: z.array(z.string().brand<'WidgetEdgesBindingNames'>()),
}).brand<'WidgetEdges'>();

export type WidgetEdges = z.infer<typeof widgetEdgesContract>;
