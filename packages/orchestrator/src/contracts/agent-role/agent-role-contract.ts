/**
 * PURPOSE: Defines valid agent role values for orchestration
 *
 * USAGE:
 * agentRoleContract.parse('pathseeker-walk');
 * // Returns: 'pathseeker-walk' as AgentRole
 */

import { z } from 'zod';

export const agentRoleContract = z.enum([
  /** @deprecated Retained for forward-compat with quest.json files that still
   * reference the monolithic pathseeker role. New work items must use one of
   * the four pathseeker-* variants below. */
  'pathseeker',
  'pathseeker-surface',
  'pathseeker-dedup',
  'pathseeker-assertion-correctness',
  'pathseeker-walk',
  'codeweaver',
  'spiritmender',
  'lawbringer',
  'siegemaster',
  'blightwarden',
]);

export type AgentRole = z.infer<typeof agentRoleContract>;
