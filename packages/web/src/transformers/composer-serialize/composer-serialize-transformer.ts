/**
 * PURPOSE: The placeholder text this produces is not decorative — the server's rewrite step finds
 * each `[Pasted Image N]` by `pastedImageStatics.placeholderPattern` and replaces it with the path
 * of the file it wrote for attachment N, matching purely by that ordinal's POSITION in the string,
 * never by attachment id or byte content. So the ordinal here has to stay a strict left-to-right
 * count of image segments — not a stable per-attachment identifier — or the server pairs a
 * placeholder with the wrong file. Reach for this when collapsing the composer's live segment list
 * down to what gets sent or saved as a draft; reach for `composerParseDraftTransformer` for the
 * inverse, turning saved draft text back into a segment list.
 *
 * USAGE:
 * composerSerializeTransformer({ segments: [ComposerSegmentStub()] });
 * // Returns ComposerSerialized — the message text with placeholders inlined, and the attachment
 * // ids those placeholders stand for, in the same left-to-right order
 */

import type { ComposerSegment } from '../../contracts/composer-segment/composer-segment-contract';
import { composerSerializedContract } from '../../contracts/composer-serialized/composer-serialized-contract';
import type { ComposerSerialized } from '../../contracts/composer-serialized/composer-serialized-contract';
import type { AttachmentId } from '../../contracts/attachment-id/attachment-id-contract';

export const composerSerializeTransformer = ({
  segments,
}: {
  segments: readonly ComposerSegment[];
}): ComposerSerialized => {
  const collected = segments.reduce(
    (accumulator, segment) =>
      segment.kind === 'text'
        ? { ...accumulator, text: accumulator.text + segment.text }
        : {
            text: `${accumulator.text}[Pasted Image ${accumulator.imageCount + 1}]`,
            attachmentIds: [...accumulator.attachmentIds, segment.attachmentId],
            imageCount: accumulator.imageCount + 1,
          },
    { text: '', attachmentIds: [] as AttachmentId[], imageCount: 0 },
  );

  return composerSerializedContract.parse({
    text: collected.text,
    attachmentIds: collected.attachmentIds,
  });
};
