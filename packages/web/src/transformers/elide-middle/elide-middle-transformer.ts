/**
 * PURPOSE: Cuts an over-long value to a width budget from the MIDDLE, because both ends carry the
 * identity and the middle carries the spine — a path's tail is its filename, so cutting the tail
 * drops the one segment the reader was looking for and leaves a run of directories they could
 * already guess. Reach for this where the value must stay on ONE line and the untouched original
 * is one disclosure away. Reach for `shortenPathsTransformer` instead where the budget belongs to
 * a whole summary line carrying several paths: that one cuts every path in the line down to two
 * named segments, which is a harder cut than a character budget and the only thing that fits a
 * `git diff -- a b c` into a row.
 *
 * USAGE:
 * elideMiddleTransformer({text: '/home/me/projects/app/src/deep/file.ts', limit: 30});
 * // Returns '/home/me/projects/…/file.ts'
 */

import { shortenedPathTextContract } from '../../contracts/shortened-path-text/shortened-path-text-contract';
import type { ShortenedPathText } from '../../contracts/shortened-path-text/shortened-path-text-contract';
import { pathShorteningStatics } from '../../statics/path-shortening/path-shortening-statics';

// The `/…/` that replaces whatever was dropped costs the ellipsis plus a separator either side.
const JOINER_SEPARATORS = 2;
const HALVES = 2;
const NOT_FOUND = -1;

export const elideMiddleTransformer = ({
  text,
  limit,
}: {
  text: string;
  limit: number;
}): ShortenedPathText => {
  if (text.length <= limit) {
    return shortenedPathTextContract.parse(text);
  }

  const segments = text.split(pathShorteningStatics.separator);
  const tail = segments[segments.length - 1] ?? '';
  const headBudget =
    limit - tail.length - pathShorteningStatics.ellipsis.length - JOINER_SEPARATORS;
  const headSegments = segments.slice(0, -1);

  // How wide the head reads once it has taken each further segment.
  const widths = headSegments.map(
    (_, index) => headSegments.slice(0, index + 1).join(pathShorteningStatics.separator).length,
  );

  // The head ends at the FIRST segment that overflows, rather than skipping it and taking a later
  // one. Splicing two segments that were never adjacent yields a path reading as contiguous —
  // `/home/me/worktrees/.quest-plans/x.md` — which names a directory nobody has, and a reader has
  // no way to tell it apart from a real one.
  const overflowIndex = widths.findIndex((width) => width > headBudget);
  const head = headSegments.slice(
    0,
    overflowIndex === NOT_FOUND ? headSegments.length : overflowIndex,
  );

  if (head.length > 0) {
    return shortenedPathTextContract.parse(
      [head.join(pathShorteningStatics.separator), pathShorteningStatics.ellipsis, tail].join(
        pathShorteningStatics.separator,
      ),
    );
  }

  // No separator to cut on, or a tail already wider than the budget. Take the same bite out of the
  // middle at the character level: it reads worse than a segment cut, but both ends still survive,
  // which is the whole reason to cut here rather than at the end.
  const half = Math.floor((limit - pathShorteningStatics.ellipsis.length) / HALVES);

  return shortenedPathTextContract.parse(
    `${text.slice(0, half)}${pathShorteningStatics.ellipsis}${text.slice(-half)}`,
  );
};
