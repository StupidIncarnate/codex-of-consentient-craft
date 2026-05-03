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

import { z } from 'zod';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { httpEdgeContract } from '../http-edge/http-edge-contract';
import { wsEdgeContract } from '../ws-edge/ws-edge-contract';
import { widgetTreeResultContract } from '../widget-tree-result/widget-tree-result-contract';

export const widgetContextContract = z.object({
  widgetTree: widgetTreeResultContract,
  httpEdges: z.array(httpEdgeContract),
  wsEdges: z.array(wsEdgeContract),
  packageRoot: absoluteFilePathContract,
  projectRoot: absoluteFilePathContract,
});

export type WidgetContext = z.infer<typeof widgetContextContract>;
