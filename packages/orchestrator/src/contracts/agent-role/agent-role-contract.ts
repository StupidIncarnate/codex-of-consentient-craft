/**
 * PURPOSE: Defines valid agent role values for orchestration
 *
 * USAGE:
 * agentRoleContract.parse('pathseeker');
 * // Returns: 'pathseeker' as AgentRole
 */

import { z } from 'zod';

export const agentRoleContract = z.enum([
  'pathseeker',
  'codeweaver',
  'spiritmender',
  'lawbringer',
  'siegemaster',
]);

export type AgentRole = z.infer<typeof agentRoleContract>;
