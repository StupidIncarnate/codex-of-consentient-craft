/**
 * PURPOSE: Defines a branded string type for flow edge references supporting cross-flow refs via "flowId:nodeId" format
 *
 * USAGE:
 * flowEdgeRefContract.parse('login-page');
 * // Returns: FlowEdgeRef branded string
 *
 * flowEdgeRefContract.parse('c23bd10b-58cc-4372-a567-0e02b2c3d479:start');
 * // Returns: FlowEdgeRef for cross-flow reference
 */

import { z } from 'zod';

export const flowEdgeRefContract = z.string().min(1).brand<'FlowEdgeRef'>();

export type FlowEdgeRef = z.infer<typeof flowEdgeRefContract>;
