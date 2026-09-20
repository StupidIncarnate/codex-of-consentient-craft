/**
 * PURPOSE: Renders the sentence `dungeonmaster siegelense` prints under the fleet table once at
 * least one row is `killed` — a reader with no other context sees a `killed` row and cannot tell it
 * from a leak; this is what says it is a TOMBSTONE instead, kept on purpose, and names `prune` as the
 * only call that removes it. The caller decides WHETHER to print this at all (a fleet with no killed
 * row prints nothing here); this file only renders the sentence once that count is known to be at
 * least one.
 *
 * USAGE:
 * killedFooterRenderTransformer({ killedCount: 2 });
 * // Returns '2 killed — tombstones, not leaks: ...\n' as branded ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { fleetListingStatics } from '../../statics/fleet-listing/fleet-listing-statics';

export const killedFooterRenderTransformer = ({
  killedCount,
}: {
  killedCount: number;
}): ContentText =>
  contentTextContract.parse(
    `${killedCount} killed — ${
      killedCount === 1
        ? fleetListingStatics.killedFooter.tombstoneSingular
        : fleetListingStatics.killedFooter.tombstonePlural
    }${fleetListingStatics.killedFooter.body}`,
  );
