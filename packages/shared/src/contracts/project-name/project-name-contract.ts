/**
 * PURPOSE: Defines the branded string type for Project names with length constraints
 *
 * USAGE:
 * projectNameContract.parse('My Project');
 * // Returns: ProjectName branded string
 */

import { z } from 'zod';

const MAX_PROJECT_NAME_LENGTH = 100;

export const projectNameContract = z
  .string()
  .min(1)
  .max(MAX_PROJECT_NAME_LENGTH)
  .brand<'ProjectName'>();

export type ProjectName = z.infer<typeof projectNameContract>;
