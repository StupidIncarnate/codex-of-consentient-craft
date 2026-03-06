/**
 * PURPOSE: Defines the branded kebab-case type for FlowEdge identifiers
 *
 * USAGE:
 * flowEdgeIdContract.parse('login-to-dashboard');
 * // Returns: FlowEdgeId branded string
 */

import { z } from 'zod';

export const flowEdgeIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'FlowEdgeId'>();

export type FlowEdgeId = z.infer<typeof flowEdgeIdContract>;
