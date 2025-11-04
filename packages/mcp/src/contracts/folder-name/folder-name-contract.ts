/**
 * PURPOSE: Defines branded string type for folder names
 *
 * USAGE:
 * const folder = folderNameContract.parse('guards');
 * // Returns branded FolderName string
 */
import { z } from 'zod';

export const folderNameContract = z.string().brand<'FolderName'>();

export type FolderName = z.infer<typeof folderNameContract>;
