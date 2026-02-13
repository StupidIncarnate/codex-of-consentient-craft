/**
 * PURPOSE: Defines the config file structure that stores registered projects
 *
 * USAGE:
 * projectConfigContract.parse({projects: [{id: 'f47ac10b-...', name: 'My Project', path: '/home/user/my-project', createdAt: '2024-01-15T10:00:00.000Z'}]});
 * // Returns: ProjectConfig object
 */

import { z } from 'zod';

import { projectContract } from '../project/project-contract';

export const projectConfigContract = z.object({
  projects: z.array(projectContract).default([]),
});

export type ProjectConfig = z.infer<typeof projectConfigContract>;
