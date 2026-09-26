/**
 * PURPOSE: Answers whether a resolved `.ts`/`.tsx` path is production code the platform-crossing
 * walk should follow, as opposed to test support the walk has no business reaching — a proxy only
 * exists to mock a real import, a stub only exists inside a test run, and following either would
 * chase a chain no shipped bundle ever loads.
 *
 * USAGE:
 * isImplementationSourceFileGuard({filePath: 'packages/web/src/widgets/chat/chat-widget.tsx'});
 * // Returns: true
 */

import { nonImplementationFileSuffixesStatics } from '../../statics/non-implementation-file-suffixes/non-implementation-file-suffixes-statics';

export const isImplementationSourceFileGuard = ({ filePath }: { filePath?: string }): boolean => {
  if (filePath === undefined || (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx'))) {
    return false;
  }

  return !nonImplementationFileSuffixesStatics.some((suffix) => filePath.endsWith(suffix));
};
