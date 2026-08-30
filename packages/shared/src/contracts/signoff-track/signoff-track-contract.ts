/**
 * PURPOSE: Names the SIGN-OFF FIELDS a verification unit carries. Reach for this wherever a value
 * selects a COLUMN to read or write — the `codeweaverSignoff` / `flowriderSignoff` /
 * `siegemasterSignoff` set, and the marker glyphs `textDisplaySymbolsStatics.signoffTrackMarks`
 * renders them as. Its sibling `signoffDenominatorTrackContract` names the DENOMINATORS over those
 * fields instead, and is the one to reach for wherever a value selects a SCOPE — "which units is
 * this role measured over".
 *
 * USAGE:
 * signoffTrackContract.parse('flowrider');
 * // Returns: SignoffTrack enum value
 *
 * A unit is done only when EVERY field carries a sign-off — Codeweaver proving it in the unit tests
 * it writes alongside the implementation, Flowrider proving it from the flow perspective below the
 * browser, Siegemaster proving it off the running system. None substitutes for another, so no
 * verdict is allowed to stand in for the set.
 *
 * A FIELD IS NOT A ROLE, even where the two lists agree member for member. More than one role can
 * write one field, over disjoint slices of the units under it, and the day that happens the
 * denominator list grows and this one does not — so a caller that takes this enum for the role list
 * would hand the new role someone else's scope.
 *
 * Each field is a SEPARATE TOP-LEVEL OPTIONAL FIELD on the element it signs — never a nested
 * `signoffs` block holding both. The quest deep-merge replaces nested object values wholesale, so a
 * nested block written by one track would silently delete the other's sign-off on the very next
 * write.
 */

import { z } from 'zod';

import { signoffTracksStatics } from '../../statics/signoff-tracks/signoff-tracks-statics';

export const signoffTrackContract = z.enum(signoffTracksStatics.fields);

export type SignoffTrack = z.infer<typeof signoffTrackContract>;
