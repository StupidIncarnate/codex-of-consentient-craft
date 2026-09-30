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

import { z } from '#gateway/npm/zod';
import { widgetNodeContract } from '../widget-node/widget-node-contract';

export const widgetTreeResultContract = z
  .object({
    roots: z.array(widgetNodeContract),
    hubs: z.array(z.string().brand<'WidgetTreeResultHubs'>()),
  })
  .brand<'WidgetTreeResult'>();

export type WidgetTreeResult = z.infer<typeof widgetTreeResultContract>;
