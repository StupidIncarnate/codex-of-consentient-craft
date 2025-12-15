/**
 * PURPOSE: Defines valid task type values
 *
 * USAGE:
 * taskTypeContract.parse('implementation');
 * // Returns: 'implementation' as TaskType
 */

import { z } from 'zod';

export const taskTypeContract = z.enum([
  'implementation',
  'testing',
  'documentation',
  'refactoring',
]);

export type TaskType = z.infer<typeof taskTypeContract>;
