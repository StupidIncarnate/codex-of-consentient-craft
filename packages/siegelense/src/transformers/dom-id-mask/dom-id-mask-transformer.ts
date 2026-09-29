/**
 * PURPOSE: Prints a DOM `id` with every per-mount segment masked, so the key's element column shows
 * every element's id and shows each the same way. Reach for this over dropping a generated id whole:
 * a framework mints ids like `mantine-gwrqe5vg6-label` and `mantine-oxhnuns51` per mount, so printing
 * them raw makes two readings of the same state differ, while dropping them hid the id on some
 * elements and not others — the choice between them hung on which character of the mint came last.
 * The id is split on `-`/`_`, each segment is tested alone against `generatedIdSegmentPattern`, and a
 * mint prints as `generatedIdMask`. An id holding no mint prints whole.
 *
 * USAGE:
 * domIdMaskTransformer({ domId: contentTextContract.parse('mantine-oxhnuns51') });
 * // Returns 'mantine-*'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { keyStatics } from '../../statics/key/key-statics';

export const domIdMaskTransformer = ({ domId }: { domId: ContentText }): ContentText => {
  const segmentPattern = new RegExp(
    keyStatics.attrs.generatedIdSegmentPattern.source,
    keyStatics.attrs.generatedIdSegmentPattern.flags,
  );

  return contentTextContract.parse(
    domId
      .split(/([-_])/u)
      .map((segment) => (segmentPattern.test(segment) ? keyStatics.attrs.generatedIdMask : segment))
      .join(''),
  );
};
