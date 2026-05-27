/**
 * PURPOSE: Returns true when a tsconfig pair has drifted from its expected references or is missing composite: true
 *
 * USAGE:
 * isTsconfigPairDriftedGuard({ pair: { currentData, expectedRefs, ensureComposite, tsconfigPath } });
 * // Returns true if on-disk references differ from expected, or if composite is required but missing
 */

import type { TsconfigReference } from '../../contracts/tsconfig-reference/tsconfig-reference-contract';
import type { TsconfigSyncPair } from '../../contracts/tsconfig-sync-pair/tsconfig-sync-pair-contract';
import { tsconfigReferencesEqualTransformer } from '../../transformers/tsconfig-references-equal/tsconfig-references-equal-transformer';

export const isTsconfigPairDriftedGuard = ({ pair }: { pair?: TsconfigSyncPair }): boolean => {
  if (pair === undefined) {
    return false;
  }

  const onDiskRefs: TsconfigReference[] = (pair.currentData.references ?? []).map((r) => ({
    path: r.path,
  }));

  const refsMatch = tsconfigReferencesEqualTransformer({ a: onDiskRefs, b: pair.expectedRefs });

  if (!refsMatch) {
    return true;
  }

  if (pair.ensureComposite && pair.currentData.compilerOptions?.composite !== true) {
    return true;
  }

  return false;
};
