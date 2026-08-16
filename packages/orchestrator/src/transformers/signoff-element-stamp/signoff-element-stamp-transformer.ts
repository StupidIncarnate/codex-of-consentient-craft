/**
 * PURPOSE: Replaces the clock reading on whichever sign-off tracks one modify-quest element is
 * actually writing. Reach for this over touching `flowriderSignoff` / `siegemasterSignoff` by name:
 * the track list is read from `signoffTracksStatics.fields`, so a third track added later is stamped
 * without anyone remembering to come back here.
 *
 * USAGE:
 * signoffElementStampTransformer({ element: { id: 'obs-1', siegemasterSignoff: {...} }, at });
 * // Returns: the same element with `siegemasterSignoff.at` replaced by `at`
 *
 * An absent track means "leave this one alone" and `null` is the clear marker a walk-reset writes;
 * neither is a sign-off arriving, so neither is stamped — a stamp on either would invent a sign-off
 * out of a patch that never claimed one.
 */
import type { ItemWithId, Signoff } from '@dungeonmaster/shared/contracts';
import { signoffTracksStatics } from '@dungeonmaster/shared/statics';

export const signoffElementStampTransformer = ({
  element,
  at,
}: {
  element: ItemWithId;
  at: Signoff['at'];
}): ItemWithId => {
  const stamped: ItemWithId = { ...element };

  for (const track of signoffTracksStatics.fields) {
    const field = `${track}Signoff`;
    const written = stamped[field];

    if (typeof written !== 'object' || written === null) {
      continue;
    }

    stamped[field] = { ...written, at };
  }

  return stamped;
};
