/**
 * PURPOSE: Compares two TsconfigReference arrays for equality by sorting on path and comparing serialized form
 *
 * USAGE:
 * tsconfigReferencesEqualTransformer({ a: [{ path: '../shared' }], b: [{ path: '../shared' }] });
 * // Returns true when the sorted path lists are identical
 */

import type { TsconfigReference } from '../../contracts/tsconfig-reference/tsconfig-reference-contract';

export const tsconfigReferencesEqualTransformer = ({
  a,
  b,
}: {
  a: readonly TsconfigReference[];
  b: readonly TsconfigReference[];
}): boolean => {
  const sortedA = [...a].map((r) => String(r.path).replace(/^\.\//u, '')).sort();
  const sortedB = [...b].map((r) => String(r.path).replace(/^\.\//u, '')).sort();
  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
};
