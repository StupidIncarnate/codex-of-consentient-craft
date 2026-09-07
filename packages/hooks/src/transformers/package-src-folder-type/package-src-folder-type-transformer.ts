/**
 * PURPOSE: Identifies which folder type a write targets, for hooks that gate on folder-detail
 * having been called this session. Reach for this over
 * projectFolderTypeFromFilePathTransformer (eslint-plugin) when the caller needs the
 * `packages/<pkg>/src/` prefix enforced and the segment checked against real folder-type keys,
 * not any word after `/src/`.
 *
 * USAGE:
 * packageSrcFolderTypeTransformer({ filePath: '/repo/packages/hooks/src/brokers/foo/foo-broker.ts' });
 * // Returns 'brokers'
 */
import { folderTypeContract } from '@dungeonmaster/shared/contracts';
import type { FolderType } from '@dungeonmaster/shared/contracts';

// Offsets from the 'packages' segment: +1 is the package name, +2 must be
// 'src', +3 is the folder-type candidate, +4 must exist (the segment being
// written into the folder type, e.g. the domain dir or the file itself).
const SRC_SEGMENT_OFFSET = 2;
const FOLDER_TYPE_SEGMENT_OFFSET = 3;
const SEGMENT_AFTER_FOLDER_TYPE_OFFSET = 4;

export const packageSrcFolderTypeTransformer = ({
  filePath,
}: {
  filePath: string;
}): FolderType | null => {
  const segments = filePath.split('/');

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const isPackagesSrcPrefix =
      segments[index] === 'packages' && segments[index + SRC_SEGMENT_OFFSET] === 'src';
    const folderTypeCandidate = segments[index + FOLDER_TYPE_SEGMENT_OFFSET];
    const hasSegmentAfter = segments[index + SEGMENT_AFTER_FOLDER_TYPE_OFFSET] !== undefined;

    if (isPackagesSrcPrefix && folderTypeCandidate !== undefined && hasSegmentAfter) {
      const result = folderTypeContract.safeParse(folderTypeCandidate);
      return result.success ? result.data : null;
    }
  }

  return null;
};
