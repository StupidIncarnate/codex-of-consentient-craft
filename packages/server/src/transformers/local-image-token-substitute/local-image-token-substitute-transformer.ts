/**
 * PURPOSE: Rewrites each local image path a scan already found, and the copy step already wrote
 * to disk, into the markdown image token the rest of the pipeline reads — leaving every path the
 * copy step skipped exactly as the user typed it. Reach for this over the sibling
 * `pastedImageTokenSubstituteTransformer`, which rewrites the browser's BARE `[Pasted Image N]`
 * placeholders; this one rewrites an already-written absolute path instead of a placeholder.
 *
 * Locating each match's occurrence skips any run preceded by `](` — the same rule
 * `localImagePathsFindTransformer` used to decide the match was a loose path in the first place.
 * Without it, a path that appears both inside an existing token and loose elsewhere in the
 * message gets its FIRST occurrence rewritten, which is the one already inside the token, nesting
 * a token inside a token. A match whose occurrence cannot be located (skipped past every
 * candidate, or never present) leaves the message untouched for that match rather than splicing
 * the replacement in at `-1`.
 *
 * USAGE:
 * localImageTokenSubstituteTransformer({
 *   message: 'before /tmp/snip.png after',
 *   matches: [{ path: '/tmp/snip.png', ordinal }],
 *   copiedPathByOrdinal: new Map([[ordinal, copiedPath]]),
 * });
 * // Returns branded UserMessage with the source path replaced by '![Pasted Image 1](<copiedPath>)'
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { userMessageContract } from '../../contracts/user-message/user-message-contract';
import type { UserMessage } from '../../contracts/user-message/user-message-contract';
import type { LocalImagePathMatch } from '../../contracts/local-image-path-match/local-image-path-match-contract';
import type { PastedImageOrdinal } from '../../contracts/pasted-image-ordinal/pasted-image-ordinal-contract';

// The two characters immediately before an occurrence, mirroring
// localImagePathsFindTransformer's rule: only `](` marks an occurrence as already sitting inside
// a `![Pasted Image N](path)` token.
const ALREADY_TOKENISED_PREFIX = '](';

export const localImageTokenSubstituteTransformer = ({
  message,
  matches,
  copiedPathByOrdinal,
}: {
  message: string;
  matches: readonly LocalImagePathMatch[];
  copiedPathByOrdinal: ReadonlyMap<PastedImageOrdinal, AbsoluteFilePath>;
}): UserMessage => {
  let rebuilt = '';
  let cursor = 0;

  for (const match of matches) {
    let occurrenceStart = message.indexOf(match.path, cursor);
    while (
      occurrenceStart !== -1 &&
      message.slice(
        Math.max(0, occurrenceStart - ALREADY_TOKENISED_PREFIX.length),
        occurrenceStart,
      ) === ALREADY_TOKENISED_PREFIX
    ) {
      occurrenceStart = message.indexOf(match.path, occurrenceStart + 1);
    }

    if (occurrenceStart === -1) {
      continue;
    }

    const occurrenceEnd = occurrenceStart + match.path.length;
    const copiedPath = copiedPathByOrdinal.get(match.ordinal);
    const replacement =
      copiedPath === undefined ? match.path : `![Pasted Image ${match.ordinal}](${copiedPath})`;

    rebuilt += message.slice(cursor, occurrenceStart) + replacement;
    cursor = occurrenceEnd;
  }

  return userMessageContract.parse(rebuilt + message.slice(cursor));
};
