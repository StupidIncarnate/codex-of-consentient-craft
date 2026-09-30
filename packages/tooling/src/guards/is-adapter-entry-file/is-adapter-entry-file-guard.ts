/**
 * PURPOSE: Says whether a repo path is the entry file of an adapter, the unit the census reports.
 * A layer file (`-layer-`), a test, a proxy and a stub sit in the same folder and are none of them
 * an adapter of their own.
 *
 * USAGE:
 * isAdapterEntryFileGuard({ file: censusPath });
 * // Returns true for packages/x/src/adapters/fs/read-file/fs-read-file-adapter.ts
 */
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';

export const isAdapterEntryFileGuard = ({ file }: { file?: string }): boolean => {
  if (file === undefined) {
    return false;
  }
  return (
    file.includes(censusLayoutStatics.adaptersSegment) &&
    /-adapter\.tsx?$/u.test(file) &&
    !file.includes('-layer-')
  );
};
