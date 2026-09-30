/**
 * PURPOSE: Says whether a scan's paths reach one package and, when they do, what to hand ESLint
 * there. An empty `targets` on an in-scope package means the whole package; it is the answer for a
 * path that names the package folder itself or for a scan given no paths at all.
 *
 * USAGE:
 * scanFolderTargetsContract.parse({ inScope: true, targets: ['src/a.ts'] });
 * // Returns: ScanFolderTargets validated object
 */

import { z } from '#gateway/npm/zod';

export const scanFolderTargetsContract = z
  .object({
    inScope: z.boolean(),
    targets: z.array(z.string().min(1).brand<'ScanFolderTargetsTargets'>()),
  })
  .brand<'ScanFolderTargets'>();

export type ScanFolderTargets = z.infer<typeof scanFolderTargetsContract>;
