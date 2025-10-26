import { z } from 'zod';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const literalOccurrenceContract = z.object({
  filePath: absoluteFilePathContract,
  line: z.number().int().positive().brand<'LineNumber'>(),
  column: z.number().int().nonnegative().brand<'ColumnNumber'>(),
});

export type LiteralOccurrence = z.infer<typeof literalOccurrenceContract>;
