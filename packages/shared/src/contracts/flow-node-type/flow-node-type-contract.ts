/**
 * PURPOSE: Defines the node type enum for flow graph nodes
 *
 * USAGE:
 * flowNodeTypeContract.parse('state');
 * // Returns: FlowNodeType enum value
 */

import { z } from 'zod';

export const flowNodeTypeContract = z.enum(['state', 'decision', 'action', 'terminal']);

export type FlowNodeType = z.infer<typeof flowNodeTypeContract>;
