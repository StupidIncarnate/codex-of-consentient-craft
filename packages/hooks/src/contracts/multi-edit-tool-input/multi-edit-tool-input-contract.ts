/**
 * PURPOSE: Zod schema for MultiEdit tool input with multiple string replacements
 *
 * USAGE:
 * const multiEdit = multiEditToolInputContract.parse(input);
 * // Returns validated MultiEditToolInput with file_path and edits array
 */
import { z } from 'zod';

export const multiEditToolInputContract = z.object({
  file_path: z.string().min(1).brand<'FilePath'>(),
  edits: z.array(
    z.object({
      old_string: z.string().brand<'OldString'>(),
      new_string: z.string().brand<'NewString'>(),
      replace_all: z.boolean().optional(),
    }),
  ),
});

export type MultiEditToolInput = z.infer<typeof multiEditToolInputContract>;
