/**
 * PURPOSE: One file's grep hits after discover's output caps have run. Reach for this over a bare
 * array of lines: a file reached after the byte budget is spent prints no lines at all and carries
 * its match count on its own label instead, and only `labelSuffix` can reach that label.
 *
 * USAGE:
 * cappedGrepHitsContract.parse({ labelSuffix: '', lines: [':14  if (a) {'] });
 * // Returns a validated CappedGrepHits
 */
import { z } from 'zod';
import { treeOutputContract } from '../tree-output/tree-output-contract';

export const cappedGrepHitsContract = z.object({
  labelSuffix: z.string().brand<'HitLabelSuffix'>(),
  lines: z.array(treeOutputContract),
});

export type CappedGrepHits = z.infer<typeof cappedGrepHitsContract>;
