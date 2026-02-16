/**
 * PURPOSE: Defines a branded string for ward errors-by-file list output
 *
 * USAGE:
 * wardErrorListContract.parse('packages/web/src/app.ts\n  lint  no-unused-vars (line 15)');
 * // Returns: WardErrorList branded string
 */

import { z } from 'zod';

export const wardErrorListContract = z.string().brand<'WardErrorList'>();

export type WardErrorList = z.infer<typeof wardErrorListContract>;
