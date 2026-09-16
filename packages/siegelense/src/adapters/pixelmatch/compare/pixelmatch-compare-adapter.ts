/**
 * PURPOSE: Counts differing pixels between two decoded frames via pixelmatch's YIQ luminance
 * comparison — one of the two files in this package allowed to import `pixelmatch` or `pngjs`
 * (chunk-03-read-path-and-perception.md W6). Pinned to `pixelmatch@^5.3.0`, never the current
 * `7.2.0` major: `pixelmatch@7` declares `"type": "module"` (pure ESM), while this package compiles
 * to CommonJS and the driver runs `dist/`, so an ESM major would turn into a `require()` of an ES
 * module — a failure that surfaces only once a real driver captures a real screenshot, not at
 * typecheck or lint time. `pixelmatch@5` itself depends on `pngjs@^6`, which is also why
 * `pngjsDecodeAdapter` stays on that major rather than `^7`: a `^7` install would sit as a second,
 * un-deduped copy alongside the one pixelmatch already resolves.
 *
 * Never catches a dimension mismatch: `adapters/` cannot import `errors/` (enforced by
 * `@dungeonmaster/enforce-project-structure`), so `ShotDimensionMismatchError` — which names the
 * two real shot PATHS — can only be raised by the broker that reads those paths and calls this
 * adapter. Passing frames of different sizes here lets pixelmatch's own buffer-length check throw
 * its own error unmodified; that satisfies the one invariant this file owns — it never fabricates a
 * `ReadingCount` for two frames that cannot be compared.
 *
 * USAGE:
 * pixelmatchCompareAdapter({ before: DecodedFrameStub(), after: DecodedFrameStub() });
 * // Returns a branded ReadingCount: the number of differing pixels
 */

import pixelmatch from 'pixelmatch';

import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import { perceptionStatics } from '../../../statics/perception/perception-statics';
import type { DecodedFrame } from '../../../contracts/decoded-frame/decoded-frame-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';

export const pixelmatchCompareAdapter = ({
  before,
  after,
}: {
  before: DecodedFrame;
  after: DecodedFrame;
}): ReadingCount => {
  const diffCount = pixelmatch(before.pixels, after.pixels, null, before.width, before.height, {
    threshold: perceptionStatics.diff.yiqThreshold,
    includeAA: false,
  });

  return readingCountContract.parse(diffCount);
};
