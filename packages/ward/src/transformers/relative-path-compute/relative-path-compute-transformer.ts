/**
 * PURPOSE: Computes a relative path from one absolute path to another
 *
 * USAGE:
 * relativePathComputeTransformer({ from: AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' }), to: AbsoluteFilePathStub({ value: '/repo/packages/shared' }) });
 * // Returns: TsconfigReferencePath '../shared'
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { tsconfigReferenceContract } from '../../contracts/tsconfig-reference/tsconfig-reference-contract';
import type { TsconfigReference } from '../../contracts/tsconfig-reference/tsconfig-reference-contract';

type TsconfigReferencePath = TsconfigReference['path'];

export const relativePathComputeTransformer = ({
  from,
  to,
}: {
  from: AbsoluteFilePath;
  to: AbsoluteFilePath;
}): TsconfigReferencePath => {
  const fromSegments = String(from)
    .split('/')
    .filter((s) => s.length > 0);
  const toSegments = String(to)
    .split('/')
    .filter((s) => s.length > 0);

  let commonCount = 0;
  while (
    commonCount < fromSegments.length &&
    commonCount < toSegments.length &&
    fromSegments[commonCount] === toSegments[commonCount]
  ) {
    commonCount += 1;
  }

  const upParts = fromSegments.slice(commonCount).map(() => '..');
  const downSegments = toSegments.slice(commonCount);
  const parts = [...upParts, ...downSegments];

  const joined = parts.join('/');
  const result = joined.length === 0 ? '.' : joined.startsWith('..') ? joined : `./${joined}`;

  return tsconfigReferenceContract.shape.path.parse(result);
};
