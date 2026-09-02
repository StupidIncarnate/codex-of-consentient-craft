/**
 * PURPOSE: A reloaded draft arrives as two independently-recovered halves — text from
 * localStorage, attachment ids from IndexedDB — that must be re-zipped in the same order they were
 * split in `composerSerializeTransformer`. The pairing is POSITIONAL (the Nth placeholder gets the
 * Nth id) rather than keyed by the ordinal a placeholder token displays, because that ordinal is
 * only ever a rendering aid for the human reading the draft back; trusting it as an address would
 * let one placeholder a user hand-edited or one record IndexedDB lost mis-address every attachment
 * after it. Reach for this only on the reload path — a live composer already holds its own segment
 * list and never needs to be reconstructed from strings.
 *
 * USAGE:
 * composerParseDraftTransformer({ text: 'A[Pasted Image 1]B', attachmentIds: [attachmentId] });
 * // Returns [{kind:'text',text:'A'}, {kind:'image',attachmentId}, {kind:'text',text:'B'}]
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { composerSegmentContract } from '../../contracts/composer-segment/composer-segment-contract';
import type { ComposerSegment } from '../../contracts/composer-segment/composer-segment-contract';
import type { AttachmentId } from '../../contracts/attachment-id/attachment-id-contract';

export const composerParseDraftTransformer = ({
  text,
  attachmentIds,
}: {
  text: string;
  attachmentIds: readonly AttachmentId[];
}): readonly ComposerSegment[] => {
  // Built fresh per call: a module-scope `g`-flagged RegExp carries `lastIndex` across calls, and
  // reusing one would make the second call see fewer matches than the first.
  const pattern = new RegExp(pastedImageStatics.placeholderPattern, 'gu');
  const segments: ComposerSegment[] = [];
  let cursor = 0;
  let ordinal = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index;

    if (start > cursor) {
      segments.push(
        composerSegmentContract.parse({ kind: 'text', text: text.slice(cursor, start) }),
      );
    }

    const attachmentId = attachmentIds[ordinal];

    // Missing-record case: the draft text survived the reload but this token's bytes did not (its
    // IndexedDB record is gone or the list ran short). The token stays as literal text rather than
    // becoming a broken image segment or vanishing — either of those would silently shorten the
    // user's sentence instead of showing that something is gone.
    segments.push(
      attachmentId === undefined
        ? composerSegmentContract.parse({ kind: 'text', text: match[0] })
        : composerSegmentContract.parse({ kind: 'image', attachmentId }),
    );

    ordinal += 1;
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push(composerSegmentContract.parse({ kind: 'text', text: text.slice(cursor) }));
  }

  return segments;
};
