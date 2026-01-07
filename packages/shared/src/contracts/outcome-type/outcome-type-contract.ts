/**
 * PURPOSE: Defines the 12 outcome types for observable verification
 *
 * USAGE:
 * outcomeTypeContract.parse('api-call');
 * // Returns: OutcomeType branded enum value
 */

import { z } from 'zod';

export const outcomeTypeContract = z.enum([
  'api-call',
  'file-exists',
  'environment',
  'log-output',
  'process-state',
  'performance',
  'ui-state',
  'cache-state',
  'db-query',
  'queue-message',
  'external-api',
  'custom',
]);

export type OutcomeType = z.infer<typeof outcomeTypeContract>;
