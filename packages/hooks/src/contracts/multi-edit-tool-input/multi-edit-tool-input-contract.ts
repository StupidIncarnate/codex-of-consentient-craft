/**
 * PURPOSE: Zod schema for MultiEdit tool input with multiple string replacements
 *
 * USAGE:
 * const multiEdit = multiEditToolInputContract.parse(input);
 * // Returns validated MultiEditToolInput with file_path and edits array
 */
import { z } from '#gateway/npm/zod';

export const multiEditToolInputContract = z
  .object({
    file_path: z.string().min(1).brand<'MultiEditToolInputFilePath'>(),
    edits: z.array(
      z
        .object({
          old_string: z.string().brand<'MultiEditToolInputEditsOldString'>(),
          new_string: z.string().brand<'MultiEditToolInputEditsNewString'>(),
          replace_all: z.boolean().optional(),
        })
        .brand<'MultiEditToolInputEdits'>(),
    ),
  })
  .brand<'MultiEditToolInput'>();

export type MultiEditToolInput = z.infer<typeof multiEditToolInputContract>;
