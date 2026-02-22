/**
 * PURPOSE: Calculates the next sequence number for quest folders based on existing folders
 *
 * USAGE:
 * const sequence = questFolderSequenceTransformer({ folders: [FolderNameStub({ value: '001-add-auth' }), FolderNameStub({ value: '002-fix-bug' })] });
 * // Returns: ContentText('003')
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { FolderName } from '../../contracts/folder-name/folder-name-contract';

const SEQUENCE_PREFIX_PATTERN = /^(\d+)-/u;
const SEQUENCE_PADDING_LENGTH = 3;

export const questFolderSequenceTransformer = ({
  folders,
}: {
  folders: readonly FolderName[];
}): ContentText => {
  const sequenceNumbers = folders
    .map((folder) => {
      const match = SEQUENCE_PREFIX_PATTERN.exec(folder);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    })
    .filter((num) => !Number.isNaN(num));

  const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
  const nextSequence = maxSequence + 1;

  return contentTextContract.parse(String(nextSequence).padStart(SEQUENCE_PADDING_LENGTH, '0'));
};
