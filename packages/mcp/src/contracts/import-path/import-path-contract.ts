/**
 * PURPOSE: Defines the schema for an import path representing a folder or module that can be imported
 *
 * USAGE:
 * const path: ImportPath = importPathContract.parse('statics');
 * // Returns validated branded string representing an import path
 */
import { z } from 'zod';

export const importPathContract = z.string().brand<'ImportPath'>();

export type ImportPath = z.infer<typeof importPathContract>;
