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

// Offsets from the 'packages' segment: +1 is the package name (or, when it starts with '@', a
// scope/group folder — see GROUP_FOLDER_SEGMENT_OFFSET below), +2 must be 'src', +3 is the
// folder-type candidate, +4 must exist (the segment being written into the folder type, e.g. the
// domain dir or the file itself).
const GROUP_FOLDER_SEGMENT_OFFSET = 1;
const SRC_SEGMENT_OFFSET = 2;
const FOLDER_TYPE_SEGMENT_OFFSET = 3;
const SEGMENT_AFTER_FOLDER_TYPE_OFFSET = 4;
const GROUP_FOLDER_PREFIX = '@';

export const packageSrcFolderTypeTransformer = ({
  filePath,
}: {
  filePath: string;
}): FolderType | null => {
  const segments = filePath.split('/');

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (segments[index] !== 'packages') {
      continue;
    }

    // A segment starting with `@` right after `packages/` is a scope/group folder (mirrors
    // `node_modules/@scope/name`), not the package itself — every offset below shifts one segment
    // further in to land on the same slots past the REAL package name.
    const groupShift = segments[index + GROUP_FOLDER_SEGMENT_OFFSET]?.startsWith(
      GROUP_FOLDER_PREFIX,
    )
      ? 1
      : 0;
    const isPackagesSrcPrefix = segments[index + SRC_SEGMENT_OFFSET + groupShift] === 'src';
    const folderTypeCandidate = segments[index + FOLDER_TYPE_SEGMENT_OFFSET + groupShift];
    const hasSegmentAfter =
      segments[index + SEGMENT_AFTER_FOLDER_TYPE_OFFSET + groupShift] !== undefined;

    if (isPackagesSrcPrefix && folderTypeCandidate !== undefined && hasSegmentAfter) {
      const result = folderTypeContract.safeParse(folderTypeCandidate);
      return result.success ? result.data : null;
    }
  }

  return null;
};
