/**
 * PURPOSE: Finds every absolute local image path a chat message carries and numbers each accepted
 * one in text order, so a later rewrite step can turn it into a `![Pasted Image N](path)` token.
 * Runs on the message AS POSTED, before any bitmap placeholder is rewritten, so a path a token has
 * already claimed is never re-numbered. Reach for this over pastedImageTokenSubstituteTransformer,
 * which rewrites an already-numbered token — this is the step that discovers the numbers first.
 *
 * USAGE:
 * localImagePathsFindTransformer({ message: 'See /tmp/a.png', startOrdinal: 1 });
 * // Returns [{ path: '/tmp/a.png', matchedText: '/tmp/a.png', ordinal: 1 }]
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { localImagePathMatchContract } from '../../contracts/local-image-path-match/local-image-path-match-contract';
import type { LocalImagePathMatch } from '../../contracts/local-image-path-match/local-image-path-match-contract';

// The two characters immediately before a match — not just one — are what distinguish an
// already-written `![Pasted Image N](path)` token from a merely parenthesized path: both put
// `(` right before the path, but only the token puts `](` there.
const ALREADY_TOKENISED_PREFIX = '](';

// What a backslash-escaped space looks like in the message, and what it stands for on disk. The
// bare alternative of `localImagePathPattern` admits these so a dragged-in screenshot path is
// matched whole; the filesystem knows nothing about the escape, so it is undone before the copy
// step ever sees the path.
const ESCAPED_SPACE = '\\ ';
const PLAIN_SPACE = ' ';

export const localImagePathsFindTransformer = ({
  message,
  startOrdinal,
}: {
  message: string;
  startOrdinal: number;
}): readonly LocalImagePathMatch[] => {
  const pattern = new RegExp(
    pastedImageStatics.localImagePathPattern,
    pastedImageStatics.localImagePathPatternFlags,
  );

  const accepted = Array.from(message.matchAll(pattern))
    .filter((match) => {
      const { index } = match;
      const precedingChar = index === 0 ? '' : (message[index - 1] ?? '');
      const isBoundary = index === 0 || /[\s(]/u.test(precedingChar);
      const twoBefore = message.slice(Math.max(0, index - ALREADY_TOKENISED_PREFIX.length), index);
      return isBoundary && twoBefore !== ALREADY_TOKENISED_PREFIX;
    })
    .map((match) => {
      // Groups 1, 2 and 3 are the double-quoted, single-quoted and bare alternatives of
      // `localImagePathPattern`, in its own declared order — exactly one of them is set per match.
      // Only the bare one can carry escapes, so only it is unescaped; a quoted path's backslash is
      // an ordinary character the shell never touched.
      const [matchedText, doubleQuoted, singleQuoted, bare] = match;
      const quoted = doubleQuoted ?? singleQuoted;

      return {
        path: quoted ?? (bare ?? matchedText).replaceAll(ESCAPED_SPACE, PLAIN_SPACE),
        matchedText,
      };
    });

  return accepted
    .map((found, position) => ({ ...found, ordinal: startOrdinal + position }))
    .filter((candidate) => candidate.ordinal <= pastedImageStatics.maxImagesPerMessage)
    .map((candidate) => localImagePathMatchContract.parse(candidate));
};
