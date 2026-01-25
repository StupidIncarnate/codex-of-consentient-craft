/**
 * PURPOSE: Defines valid task type values
 *
 * USAGE:
 * taskTypeContract.parse('implementation');
 * // Returns: 'implementation' as TaskType
 */

import { z } from 'zod';

export const taskTypeContract = z.enum([
  'discovery',
  'implementation',
  'testing',
  'review',
  'documentation',
  'configuration',
  'migration',
]);

export type TaskType = z.infer<typeof taskTypeContract>;
