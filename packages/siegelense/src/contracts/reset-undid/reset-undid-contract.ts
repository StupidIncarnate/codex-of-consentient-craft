/**
 * PURPOSE: Reports the diff undid by a reset step ({ files, added, modified, removed }).
 *
 * USAGE:
 * resetUndidContract.parse({ files: 4, added: 2, modified: 1, removed: 1 });
 * // Returns a validated ResetUndid
 */

import { z } from '#gateway/npm/zod';


export const resetUndidContract = z.object({
  files: z.number().int().nonnegative().brand<'ResetUndidFiles'>(),
  added: z.number().int().nonnegative().brand<'ResetUndidAdded'>(),
  modified: z.number().int().nonnegative().brand<'ResetUndidModified'>(),
  removed: z.number().int().nonnegative().brand<'ResetUndidRemoved'>(),
}).brand<'ResetUndid'>();

export type ResetUndid = z.infer<typeof resetUndidContract>;
