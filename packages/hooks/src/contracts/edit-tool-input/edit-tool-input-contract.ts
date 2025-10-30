/**
 * PURPOSE: Zod schema for validating Edit tool input structure
 *
 * USAGE:
 * const editInput = editToolInputContract.parse(input);
 * // Returns validated EditToolInput with file_path, old_string, new_string, optional replace_all
 */
import { z } from 'zod';

export const editToolInputContract = z.object({
  file_path: z.string().min(1).brand<'FilePath'>(),
  old_string: z.string().brand<'OldString'>(),
  new_string: z.string().brand<'NewString'>(),
  replace_all: z.boolean().optional(),
});

export type EditToolInput = z.infer<typeof editToolInputContract>;
