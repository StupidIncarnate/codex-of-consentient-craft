/**
 * PURPOSE: Finds every absolute local image path a chat message carries and numbers each accepted
 * one in text order, so a later rewrite step can turn it into a `![Pasted Image N](path)` token.
 * Runs on the message AS POSTED, before any bitmap placeholder is rewritten, so a path a token has
 * already claimed is never re-numbered. Reach for this over pastedImageTokenSubstituteTransformer,
 * which rewrites an already-numbered token — this is the step that discovers the numbers first.
 *
 * USAGE:
 * localImagePathsFindTransformer({ message: 'See /tmp/a.png', startOrdinal: 1 });
 * // Returns [{ path: '/tmp/a.png', ordinal: 1 }]
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { localImagePathMatchContract } from '../../contracts/local-image-path-match/local-image-path-match-contract';
import type { LocalImagePathMatch } from '../../contracts/local-image-path-match/local-image-path-match-contract';

// The two characters immediately before a match — not just one — are what distinguish an
// already-written `![Pasted Image N](path)` token from a merely parenthesized path: both put
// `(` right before the path, but only the token puts `](` there.
const ALREADY_TOKENISED_PREFIX = '](';

export const localImagePathsFindTransformer = ({
  message,
  startOrdinal,
}: {
  message: string;
  startOrdinal: number;
}): readonly LocalImagePathMatch[] => {
  const pattern = new RegExp(pastedImageStatics.localImagePathPattern, 'gu');

  const acceptedPaths = Array.from(message.matchAll(pattern))
    .filter((match) => {
      const { index } = match;
      const precedingChar = index === 0 ? '' : (message[index - 1] ?? '');
      const isBoundary = index === 0 || /[\s(]/u.test(precedingChar);
      const twoBefore = message.slice(Math.max(0, index - ALREADY_TOKENISED_PREFIX.length), index);
      return isBoundary && twoBefore !== ALREADY_TOKENISED_PREFIX;
    })
    .map((match) => match[0]);

  return acceptedPaths
    .map((path, position) => ({ path, ordinal: startOrdinal + position }))
    .filter((candidate) => candidate.ordinal <= pastedImageStatics.maxImagesPerMessage)
    .map((candidate) => localImagePathMatchContract.parse(candidate));
};
