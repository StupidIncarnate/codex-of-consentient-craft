/**
 * PURPOSE: Defines the location structure for a literal occurrence with file path, line, and column.
 *
 * USAGE:
 * const occurrence = literalOccurrenceContract.parse({ filePath: '/path/file.ts', line: 10, column: 5 });
 * // Returns: LiteralOccurrence (object with filePath, line, column)
 */
import { z } from 'zod';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const literalOccurrenceContract = z.object({
  filePath: absoluteFilePathContract,
  line: z.number().int().positive().brand<'LineNumber'>(),
  column: z.number().int().nonnegative().brand<'ColumnNumber'>(),
});

export type LiteralOccurrence = z.infer<typeof literalOccurrenceContract>;
