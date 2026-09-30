/**
 * PURPOSE: One call an adapter makes into something the repo does not own: a bare npm or Node
 * import, a global, or a gateway export. `module` is the import specifier, or the global's own
 * name; the census matches gateway exports on that pair.
 *
 * USAGE:
 * outsideCallContract.parse({ module: 'fs/promises', name: 'readFile' });
 * // Returns: OutsideCall
 */
import { z } from '#gateway/npm/zod';

export const outsideCallContract = z.object({
  module: z.string().min(1).brand<'OutsideCallModule'>(),
  name: z.string().min(1).brand<'OutsideCallName'>(),
});

export type OutsideCall = z.infer<typeof outsideCallContract>;
