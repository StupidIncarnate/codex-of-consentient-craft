/**
 * PURPOSE: Recovers the PATH a failed write was aimed at, off node's own `SystemError.path`. Reach
 * for this because a bare `String(error)` carries only the errno, which is how a read-only mount
 * reads as a mystery rather than naming the file it could not touch.
 *
 * USAGE:
 * writeFailureTransformer({ cause: new Error('plain error, no path') });
 * // Returns { path: null }
 */
import { writeFailureContract } from '../../contracts/write-failure/write-failure-contract';
import type { WriteFailure } from '../../contracts/write-failure/write-failure-contract';

export const writeFailureTransformer = ({ cause }: { cause?: unknown }): WriteFailure => {
  if (
    typeof cause === 'object' &&
    cause !== null &&
    'path' in cause &&
    typeof cause.path === 'string'
  ) {
    return writeFailureContract.parse({ path: cause.path });
  }
  return writeFailureContract.parse({ path: null });
};
