/**
 * PURPOSE: Defines a branded string type for flow edge references supporting cross-flow refs via "flowId:nodeId" format
 *
 * USAGE:
 * flowEdgeRefContract.parse('login-page');
 * // Returns: FlowEdgeRef branded string
 *
 * flowEdgeRefContract.parse('login-flow:start');
 * // Returns: FlowEdgeRef for cross-flow reference
 */

import { z } from 'zod';

export const flowEdgeRefContract = z.string().min(1).brand<'FlowEdgeRef'>();

export type FlowEdgeRef = z.infer<typeof flowEdgeRefContract>;
