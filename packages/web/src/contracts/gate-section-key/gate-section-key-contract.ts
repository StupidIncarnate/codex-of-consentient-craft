/**
 * PURPOSE: Defines valid section keys for quest spec panel gate visibility
 *
 * USAGE:
 * gateSectionKeyContract.parse('flows');
 * // Returns: GateSectionKey branded enum value
 */

import { z } from 'zod';

export const gateSectionKeyContract = z.enum([
  'flows',
  'designDecisions',
  'requirements',
  'contexts',
  'observables',
  'contracts',
  'toolingRequirements',
]);

export type GateSectionKey = z.infer<typeof gateSectionKeyContract>;
