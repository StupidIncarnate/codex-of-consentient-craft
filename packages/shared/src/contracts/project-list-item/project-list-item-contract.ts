/**
 * PURPOSE: Extends the project contract with runtime information for list views
 *
 * USAGE:
 * projectListItemContract.parse({id: 'f47ac10b-...', name: 'My Project', path: '/home/user/my-project', createdAt: '2024-01-15T10:00:00.000Z', valid: true, questCount: 3});
 * // Returns: ProjectListItem object
 */

import { z } from 'zod';

import { projectContract } from '../project/project-contract';

export const projectListItemContract = projectContract.extend({
  valid: z.boolean(),
  questCount: z.number().int().min(0).brand<'QuestCount'>(),
});

export type ProjectListItem = z.infer<typeof projectListItemContract>;
