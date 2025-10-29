import { z } from 'zod';

/**
 * PURPOSE: Validates and brands forbidden folder name strings (e.g., 'utils', 'helpers', 'common')
 *
 * USAGE:
 * const forbidden = forbiddenFolderNameContract.parse('utils');
 * // Returns branded ForbiddenFolderName for use in project structure validation
 */
export const forbiddenFolderNameContract = z.string().brand<'ForbiddenFolderName'>();

export type ForbiddenFolderName = z.infer<typeof forbiddenFolderNameContract>;
