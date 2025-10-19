import { z } from 'zod';

export const forbiddenFolderNameContract = z.string().brand<'ForbiddenFolderName'>();

export type ForbiddenFolderName = z.infer<typeof forbiddenFolderNameContract>;
