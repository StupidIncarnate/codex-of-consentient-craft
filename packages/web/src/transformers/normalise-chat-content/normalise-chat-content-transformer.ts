/**
 * PURPOSE: A pasted-image user message exists as two copies that can never be string-equal — the
 * optimistic bubble the browser rendered from its own composer serialisation, and the transcript
 * copy that comes back off disk carrying resolved image URLs plus a read-the-images trailer.
 * Reach for this before any comparison that expects the same logical message to produce the same
 * string on both sides (e.g. deduping a locally-staged entry against a replayed one).
 *
 * USAGE:
 * normaliseChatContentTransformer({ content: 'A![Pasted Image 1](http://host/api/images?path=x)B' });
 * // Returns branded UserInput 'A[Pasted Image 1]B'
 */

import { userInputContract } from '@dungeonmaster/shared/contracts';
import type { UserInput } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

export const normaliseChatContentTransformer = ({ content }: { content: string }): UserInput => {
  const sentinelIndex = content.indexOf(pastedImageStatics.promptSentinel);
  const withoutTrailer = sentinelIndex === -1 ? content : content.slice(0, sentinelIndex);

  // pastedImageStatics.imageTokenPattern is `!` + placeholderPattern + `\(([^)]+)\)`, so every
  // token match contains a placeholderPattern match starting right after the leading `!`.
  // placeholderPattern's own source, stripped of its regex escapes and with its `(\d+)` capture
  // swapped for a `$1` backreference, IS the replacement template `.replace()` needs — so the bare
  // form produced here can never drift from what placeholderPattern itself matches.
  const placeholderTemplate = pastedImageStatics.placeholderPattern
    .replaceAll('\\', '')
    .replace('(d+)', '$1');

  const withBarePlaceholders = withoutTrailer.replace(
    new RegExp(pastedImageStatics.imageTokenPattern, 'gu'),
    placeholderTemplate,
  );

  return userInputContract.parse(withBarePlaceholders.trimEnd());
};
