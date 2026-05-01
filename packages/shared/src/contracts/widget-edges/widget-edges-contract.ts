/**
 * PURPOSE: Defines the WidgetEdges structure — outgoing edges from a widget file in the
 * widget composition graph (child widget paths and binding names)
 *
 * USAGE:
 * const edges: WidgetEdges = { childWidgetPaths: [], bindingNames: [] };
 *
 * WHEN-TO-USE: Passing edge data between extractWidgetEdgesLayerBroker and buildWidgetNodeLayerBroker
 */

import { z } from 'zod';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { contentTextContract } from '../content-text/content-text-contract';

export const widgetEdgesContract = z.object({
  childWidgetPaths: z.array(absoluteFilePathContract),
  bindingNames: z.array(contentTextContract),
});

export type WidgetEdges = z.infer<typeof widgetEdgesContract>;
