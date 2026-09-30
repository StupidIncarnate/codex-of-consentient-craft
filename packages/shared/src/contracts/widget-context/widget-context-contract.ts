/**
 * PURPOSE: Bundles widget tree + HTTP/WS edges + package root for use by the boot-tree's
 * responder-lines renderer when integrating widget composition under each responder
 *
 * USAGE:
 * widgetContextContract.parse({
 *   widgetTree,
 *   httpEdges: [],
 *   wsEdges: [],
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 * });
 * // Returns validated WidgetContext for cross-broker plumbing
 *
 * WHEN-TO-USE: Plumbing widget data through the boot-tree call chain for frontend-react packages
 */

import { z } from '#gateway/npm/zod';
import { httpEdgeContract } from '../http-edge/http-edge-contract';
import { wsEdgeContract } from '../ws-edge/ws-edge-contract';
import { widgetTreeResultContract } from '../widget-tree-result/widget-tree-result-contract';

export const widgetContextContract = z.object({
  widgetTree: widgetTreeResultContract,
  httpEdges: z.array(httpEdgeContract),
  wsEdges: z.array(wsEdgeContract),
  packageRoot: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'WidgetContextPackageRoot'>(),
  projectRoot: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'WidgetContextProjectRoot'>(),
}).brand<'WidgetContext'>();

export type WidgetContext = z.infer<typeof widgetContextContract>;
