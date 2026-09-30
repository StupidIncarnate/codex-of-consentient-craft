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

import { keyStatics } from '../../statics/key/key-statics';

export const domIdMaskTransformer = ({ domId }: { domId: string }): string => {
  const segmentPattern = new RegExp(
    keyStatics.attrs.generatedIdSegmentPattern.source,
    keyStatics.attrs.generatedIdSegmentPattern.flags,
  );

  const prefixedPattern = new RegExp(
    keyStatics.attrs.generatedIdPrefixedPattern.source,
    keyStatics.attrs.generatedIdPrefixedPattern.flags,
  );

  // Two tests, one mask: a segment holding a digit and a letter is a mint, and so is the nine
  // base36 characters straight after `mantine-`, because Mantine's `useId` mints letters-only ids
  // (`qeldlpsyt`) too. Nothing else prints as the mask, so `main-content` and `quest-row-2` stay whole.
  return domId
    .split(/([-_])/u)
    .map((segment) => (segmentPattern.test(segment) ? keyStatics.attrs.generatedIdMask : segment))
    .join('')
    .replace(prefixedPattern, keyStatics.attrs.generatedIdMask);
};
