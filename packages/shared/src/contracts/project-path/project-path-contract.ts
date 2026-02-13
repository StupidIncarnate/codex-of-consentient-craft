/**
 * PURPOSE: Defines the branded string type for Project filesystem paths
 *
 * USAGE:
 * projectPathContract.parse('/home/user/my-project');
 * // Returns: ProjectPath branded string
 */

import { z } from 'zod';

export const projectPathContract = z.string().min(1).brand<'ProjectPath'>();

export type ProjectPath = z.infer<typeof projectPathContract>;
