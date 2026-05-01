/**
 * PURPOSE: Defines the WidgetTreeResult structure returned by architectureWidgetTreeBroker
 *
 * USAGE:
 * widgetTreeResultContract.parse({
 *   roots: [],
 *   hubs: [],
 * });
 * // Returns validated WidgetTreeResult
 *
 * WHEN-TO-USE: Consuming the widget composition tree output from architectureWidgetTreeBroker
 * in the frontend-react project-map renderer
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { widgetNodeContract } from '../widget-node/widget-node-contract';

export const widgetTreeResultContract = z.object({
  roots: z.array(widgetNodeContract),
  hubs: z.array(contentTextContract),
});

export type WidgetTreeResult = z.infer<typeof widgetTreeResultContract>;
