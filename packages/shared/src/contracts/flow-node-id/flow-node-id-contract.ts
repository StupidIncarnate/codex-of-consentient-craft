/**
 * PURPOSE: Defines a branded string type for flow node identifiers using kebab-case
 *
 * USAGE:
 * flowNodeIdContract.parse('view-list');
 * // Returns: FlowNodeId branded string
 */

import { z } from 'zod';

export const flowNodeIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'FlowNodeId'>();

export type FlowNodeId = z.infer<typeof flowNodeIdContract>;
