/**
 * PURPOSE: Defines the branded UUID type for Project identifiers
 *
 * USAGE:
 * projectIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: ProjectId branded string
 */

import { z } from 'zod';

export const projectIdContract = z.string().uuid().brand<'ProjectId'>();

export type ProjectId = z.infer<typeof projectIdContract>;
