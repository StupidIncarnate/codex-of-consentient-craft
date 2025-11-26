/**
 * PURPOSE: Validates import paths in TypeScript files
 *
 * USAGE:
 * importPathContract.parse('./test.proxy');
 * // Returns validated ImportPath branded type
 */

import { z } from 'zod';

export const importPathContract = z.string().brand<'ImportPath'>();

export type ImportPath = z.infer<typeof importPathContract>;
