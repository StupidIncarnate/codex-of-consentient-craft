import { z } from 'zod';

export const folderSuggestionContract = z.string().brand<'FolderSuggestion'>();

export type FolderSuggestion = z.infer<typeof folderSuggestionContract>;
