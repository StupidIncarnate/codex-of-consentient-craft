/**
 * PURPOSE: A pasted-image user message exists as two copies that can never be string-equal — the
 * optimistic bubble the browser rendered from its own composer serialisation (a bare placeholder
 * for a pasted bitmap, raw path text for a typed screenshot path), and the transcript copy that
 * comes back off disk carrying resolved markdown image tokens plus a read-the-images trailer.
 * Reach for this before any comparison that expects the same logical message to produce the same
 * string on both sides (e.g. deduping a locally-staged entry against a replayed one).
 *
 * USAGE:
 * normaliseChatContentTransformer({ content: 'A![Pasted Image 1](http://host/api/images?path=x)B' });
 * // Returns branded UserInput 'A[Pasted Image]B'
 */

import { userInputContract } from '@dungeonmaster/shared/contracts';
import type { UserInput } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

export const normaliseChatContentTransformer = ({ content }: { content: string }): UserInput => {
  const sentinelIndex = content.indexOf(pastedImageStatics.promptSentinel);
  const withoutTrailer = sentinelIndex === -1 ? content : content.slice(0, sentinelIndex);

  // placeholderPattern's own source, stripped of its regex escapes and with its ` (\d+)` ordinal
  // capture dropped outright rather than backreferenced, IS the marker every image reference
  // collapses to — so it can never drift from what placeholderPattern itself matches. The ordinal
  // is dropped, not renumbered: local-image-paths-find-transformer numbers a screenshot path AFTER
  // the message's pasted bitmaps, so a mixed message's token ordinals are not in text order and
  // position cannot recompute them.
  const ordinalFreeMarker = pastedImageStatics.placeholderPattern
    .replaceAll('\\', '')
    .replace(' (d+)', '');

  // imageTokenPattern's capture group 2 is a URL or path, and a served `/api/images?path=…png`
  // URL itself matches localImagePathPattern — so tokens must reduce first, or local-path
  // reduction strips the URL out from inside a token still waiting to be reduced.
  const withoutTokens = withoutTrailer.replace(
    new RegExp(pastedImageStatics.imageTokenPattern, 'gu'),
    ordinalFreeMarker,
  );

  const withoutBarePlaceholders = withoutTokens.replace(
    new RegExp(pastedImageStatics.placeholderPattern, 'gu'),
    ordinalFreeMarker,
  );

  const withoutLocalPaths = withoutBarePlaceholders.replace(
    new RegExp(pastedImageStatics.localImagePathPattern, 'gu'),
    ordinalFreeMarker,
  );

  return userInputContract.parse(withoutLocalPaths.trimEnd());
};
