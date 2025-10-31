/**
 * PURPOSE: Validates and brands folder suggestion strings used in error messages
 *
 * USAGE:
 * const suggestion = folderSuggestionContract.parse('Move to /src/brokers/ folder');
 * // Returns branded FolderSuggestion string for displaying in lint errors
 */
import { z } from 'zod';

export const folderSuggestionContract = z.string().brand<'FolderSuggestion'>();

export type FolderSuggestion = z.infer<typeof folderSuggestionContract>;
