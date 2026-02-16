/**
 * PURPOSE: Defines a branded string for detailed ward errors for a specific file
 *
 * USAGE:
 * wardFileDetailContract.parse('src/app.ts\n  lint  no-unused-vars (line 15)\n    message: ...');
 * // Returns: WardFileDetail branded string
 */

import { z } from 'zod';

export const wardFileDetailContract = z.string().brand<'WardFileDetail'>();

export type WardFileDetail = z.infer<typeof wardFileDetailContract>;
