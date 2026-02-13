/**
 * PURPOSE: Defines the main project structure with identity, path, and creation metadata
 *
 * USAGE:
 * projectContract.parse({id: 'f47ac10b-...', name: 'My Project', path: '/home/user/my-project', createdAt: '2024-01-15T10:00:00.000Z'});
 * // Returns: Project object
 */

import { z } from 'zod';

import { projectIdContract } from '../project-id/project-id-contract';
import { projectNameContract } from '../project-name/project-name-contract';
import { projectPathContract } from '../project-path/project-path-contract';

export const projectContract = z.object({
  id: projectIdContract,
  name: projectNameContract,
  path: projectPathContract,
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type Project = z.infer<typeof projectContract>;
