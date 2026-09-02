/**
 * PURPOSE: A transcript bubble has to read back exactly as the user composed it, whichever of the
 * two forms the message currently carries — the bare `[Pasted Image N]` placeholder an optimistic
 * entry still holds before its own send round-trips, or the full `![Pasted Image N](url)` markdown
 * token a saved transcript persists once the server has resolved a servable path. One pass over the
 * content, matching both forms at once, is what keeps an image at the exact sentence position it was
 * composed at rather than reordering it relative to the surrounding text. Reach for this over
 * composerParseDraftTransformer whenever a message is being read back for DISPLAY — that transformer
 * pairs a placeholder to an attachmentId positionally for a still-live composer and never resolves a
 * renderable `src`.
 *
 * USAGE:
 * parseTranscriptSegmentsTransformer({ content: 'A![Pasted Image 1](http://host/api/images?path=x)B' });
 * // Returns [{kind:'text',text:'A'}, {kind:'image',ordinal:1,src:'http://host/api/images?path=x'}, {kind:'text',text:'B'}]
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { transcriptSegmentContract } from '../../contracts/transcript-segment/transcript-segment-contract';
import type { TranscriptSegment } from '../../contracts/transcript-segment/transcript-segment-contract';
import type { ImageDataUrl } from '../../contracts/image-data-url/image-data-url-contract';

export const parseTranscriptSegmentsTransformer = ({
  content,
  memoryImages,
}: {
  content: string;
  memoryImages?: readonly ImageDataUrl[];
}): readonly TranscriptSegment[] => {
  const sentinelIndex = content.indexOf(pastedImageStatics.promptSentinel);
  const withoutTrailer = sentinelIndex === -1 ? content : content.slice(0, sentinelIndex);

  // The token alternative goes first: placeholderPattern also matches the `[Pasted Image N]` span
  // INSIDE an imageTokenPattern match, so putting it first would split one token into an image plus
  // a stray text `(url)`. imageTokenPattern owns capture groups 1 (ordinal) and 2 (src); appending
  // placeholderPattern after it shifts placeholderPattern's own ordinal group to slot 3 — that
  // offset is derived from the two pattern strings themselves, not guessed.
  const pattern = new RegExp(
    `${pastedImageStatics.imageTokenPattern}|${pastedImageStatics.placeholderPattern}`,
    'gu',
  );

  const segments: TranscriptSegment[] = [];
  let cursor = 0;

  for (const match of withoutTrailer.matchAll(pattern)) {
    const start = match.index;

    if (start > cursor) {
      segments.push(
        transcriptSegmentContract.parse({
          kind: 'text',
          text: withoutTrailer.slice(cursor, start),
        }),
      );
    }

    const [, tokenOrdinal, tokenSrc, placeholderOrdinal] = match;

    if (tokenOrdinal !== undefined && tokenSrc !== undefined) {
      segments.push(
        transcriptSegmentContract.parse({
          kind: 'image',
          ordinal: Number(tokenOrdinal),
          src: tokenSrc,
        }),
      );
    } else if (placeholderOrdinal !== undefined) {
      const memorySrc = memoryImages?.[Number(placeholderOrdinal) - 1];

      // Missing-record case: the bytes for this placeholder are gone (no memoryImages, or this
      // ordinal's entry is absent). The raw `[Pasted Image N]` characters are dropped entirely
      // rather than left on screen or turned into a broken image segment — either would misreport
      // what the message actually contains.
      if (memorySrc !== undefined) {
        segments.push(
          transcriptSegmentContract.parse({
            kind: 'image',
            ordinal: Number(placeholderOrdinal),
            src: memorySrc,
          }),
        );
      }
    }

    cursor = start + match[0].length;
  }

  if (cursor < withoutTrailer.length) {
    segments.push(
      transcriptSegmentContract.parse({ kind: 'text', text: withoutTrailer.slice(cursor) }),
    );
  }

  return segments;
};
