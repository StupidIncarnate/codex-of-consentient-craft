/**
 * PURPOSE: Counts the number of dots in a string
 *
 * USAGE:
 * const count = dotCountTransformer({ str: 'user.test.ts' });
 * // Returns 2
 * const count2 = dotCountTransformer({ str: 'user-broker.ts' });
 * // Returns 1
 *
 * WHEN-TO-USE: When determining if a file has multiple dots (like .test.ts, .stub.ts)
 */
import { depthCountContract } from '../../contracts/depth-count/depth-count-contract';
import type { DepthCount } from '../../contracts/depth-count/depth-count-contract';

export const dotCountTransformer = ({ str }: { str: string }): DepthCount => {
  const matches = str.match(/\./gu);
  const count = matches ? matches.length : 0;

  return depthCountContract.parse(count);
};
