/**
 * PURPOSE: An identifier a module exports or imports, including the pseudo-names `default` and `*` the census uses for default and namespace imports.
 *
 * USAGE:
 * exportNameContract.parse('readFile');
 * // Returns: ExportName (branded string)
 */
import { z } from 'zod';

export const exportNameContract = z.string().min(1).brand<'ExportName'>();

export type ExportName = z.infer<typeof exportNameContract>;
