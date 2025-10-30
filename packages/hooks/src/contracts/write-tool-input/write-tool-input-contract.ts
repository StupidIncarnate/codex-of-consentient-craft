/**
 * PURPOSE: Zod schema for Write tool input structure
 *
 * USAGE:
 * const writeInput = writeToolInputContract.parse(input);
 * // Returns validated WriteToolInput with file_path and content
 */
import { z } from 'zod';

export const writeToolInputContract = z.object({
  file_path: z.string().min(1).brand<'FilePath'>(),
  content: z.string().brand<'FileContent'>(),
});

export type WriteToolInput = z.infer<typeof writeToolInputContract>;
