/**
 * PURPOSE: Buys back the horizontal room a one-line tool row needs, by keeping the two segments of
 * a path that identify it — which package, which file — and eliding the directory spine between
 * them. Applied to a whole summary line rather than a single path, because a `git diff -- a b c`
 * row carries several and the row has one width to share among them.
 *
 * Reach for this only where the untouched path stays reachable (an expandable detail, a tooltip).
 * The output names a file to a human but no longer resolves to one.
 *
 * USAGE:
 * shortenPathsTransformer({text: 'packages/web/src/widgets/tool-row/tool-row-widget.tsx'});
 * // Returns 'web/…/tool-row-widget.tsx'
 */

import { shortenedPathTextContract } from '../../contracts/shortened-path-text/shortened-path-text-contract';
import type { ShortenedPathText } from '../../contracts/shortened-path-text/shortened-path-text-contract';
import { pathShorteningStatics } from '../../statics/path-shortening/path-shortening-statics';

const SPLIT_KEEPING_WHITESPACE = /(\s+)/u;
const WILDCARD_ONLY = /^\*+$/u;
const URL_SCHEME = '://';

export const shortenPathsTransformer = ({ text }: { text: string }): ShortenedPathText =>
  shortenedPathTextContract.parse(
    text
      .split(SPLIT_KEEPING_WHITESPACE)
      .map((token) => {
        if (!token.includes(pathShorteningStatics.separator) || token.includes(URL_SCHEME)) {
          return token;
        }

        const isAbsolute = token.startsWith(pathShorteningStatics.separator);
        const segments = token
          .split(pathShorteningStatics.separator)
          .filter((segment) => segment !== '');

        if (segments.length < pathShorteningStatics.minSegments) {
          return token;
        }

        // In this monorepo `packages` is a constant, so the package name one past it is the
        // segment that actually tells them apart. Elsewhere the first segment is the best anchor.
        const packagesIndex = segments.indexOf(pathShorteningStatics.packagesSegment);
        const anchorIndex =
          packagesIndex !== -1 && packagesIndex + 1 < segments.length ? packagesIndex + 1 : 0;

        // A glob ending in `**` names no file, so the directory it globs comes along as the tail.
        const lastIndex = segments.length - 1;
        const tailStart = WILDCARD_ONLY.test(segments[lastIndex] ?? '')
          ? Math.max(anchorIndex + 1, lastIndex - 1)
          : lastIndex;

        if (tailStart <= anchorIndex) {
          return token;
        }

        const anchor = segments[anchorIndex] ?? '';
        const tail = segments.slice(tailStart);
        const elided = tailStart > anchorIndex + 1;
        const prefix = isAbsolute && anchorIndex === 0 ? pathShorteningStatics.separator : '';

        return `${prefix}${[anchor, ...(elided ? [pathShorteningStatics.ellipsis] : []), ...tail].join(pathShorteningStatics.separator)}`;
      })
      .join(''),
  );
