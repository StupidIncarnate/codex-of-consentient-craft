/**
 * PURPOSE: Defines a single entry in a tsconfig.json `references` array (path-only form)
 *
 * USAGE:
 * tsconfigReferenceContract.parse({ path: '../shared' });
 * // Returns: TsconfigReference validated object whose `path` is relative to the tsconfig dir
 */

import { z } from 'zod';

export const tsconfigReferenceContract = z.object({
  path: z.string().brand<'TsconfigReferencePath'>(),
});

export type TsconfigReference = z.infer<typeof tsconfigReferenceContract>;
