/**
 * PURPOSE: Defines the structure of a lint or typecheck error entry
 *
 * USAGE:
 * errorEntryContract.parse({filePath: 'src/index.ts', line: 10, column: 5, message: 'Unexpected any', severity: 'error'});
 * // Returns: ErrorEntry validated object
 */

import { z } from 'zod';

export const errorEntryContract = z.object({
  filePath: z.string().brand<'ErrorFilePath'>(),
  line: z.number().brand<'ErrorLine'>(),
  column: z.number().brand<'ErrorColumn'>(),
  message: z.string().brand<'ErrorMessage'>(),
  rule: z.string().brand<'ErrorRule'>().optional(),
  severity: z.enum(['error', 'warning']),
});

export type ErrorEntry = z.infer<typeof errorEntryContract>;
