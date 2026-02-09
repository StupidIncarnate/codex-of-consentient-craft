/**
 * PURPOSE: Calculates the next sequence number for quest folders based on existing folders
 *
 * USAGE:
 * const sequence = questFolderSequenceTransformer({ folders: [FileNameStub({ value: '001-add-auth' })] });
 * // Returns: ContentText('002')
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { FileName } from '../../contracts/file-name/file-name-contract';

const SEQUENCE_PREFIX_PATTERN = /^(\d+)-/u;
const SEQUENCE_PADDING_LENGTH = 3;

export const questFolderSequenceTransformer = ({
  folders,
}: {
  folders: readonly FileName[];
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
