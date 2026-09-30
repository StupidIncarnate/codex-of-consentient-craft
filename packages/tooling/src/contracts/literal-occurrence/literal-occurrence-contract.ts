/**
 * PURPOSE: Defines the location structure for a literal occurrence with file path, line, and column.
 *
 * USAGE:
 * const occurrence = literalOccurrenceContract.parse({ filePath: '/path/file.ts', line: 10, column: 5 });
 * // Returns: LiteralOccurrence (object with filePath, line, column)
 */
import { z } from '#gateway/npm/zod';

export const literalOccurrenceContract = z
  .object({
    filePath: z.string().brand<'LiteralOccurrenceFilePath'>(),
    line: z.number().int().positive().brand<'LiteralOccurrenceLine'>(),
    column: z.number().int().nonnegative().brand<'LiteralOccurrenceColumn'>(),
  })
  .brand<'LiteralOccurrence'>();

export type LiteralOccurrence = z.infer<typeof literalOccurrenceContract>;
