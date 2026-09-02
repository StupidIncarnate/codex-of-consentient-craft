/**
 * PURPOSE: A path reaching this guard made a full round trip through a URL query value, so it
 * is distrusted whatever produced it — this is the checkpoint before the route decides to touch
 * the filesystem at all, not a place to trust upstream encoding or intent.
 *
 * USAGE:
 * isServableImagePathGuard({ path: '/tmp/quest/images/abc.png' }); // true
 * isServableImagePathGuard({ path: '/a/../../../../etc/passwd' }); // false
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { imageServeStatics } from '../../statics/image-serve/image-serve-statics';

export const isServableImagePathGuard = ({ path }: { path?: string }): boolean => {
  if (!path || !absoluteFilePathContract.safeParse(path).success) {
    return false;
  }

  if (path.length > imageServeStatics.maxPathLength) {
    return false;
  }

  if (path.split('/').includes('..')) {
    return false;
  }

  if (path.includes(String.fromCharCode(0))) {
    return false;
  }

  if (path.includes('\n') || path.includes('\r')) {
    return false;
  }

  return true;
};
