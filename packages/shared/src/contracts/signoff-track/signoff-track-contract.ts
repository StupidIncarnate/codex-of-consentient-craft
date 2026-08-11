/**
 * PURPOSE: Names the two SIGN-OFF FIELDS a verification unit carries. Reach for this wherever a
 * value selects a COLUMN to read or write — the `flowriderSignoff` / `siegemasterSignoff` pair, and
 * the marker glyphs `textDisplaySymbolsStatics.signoffTrackMarks` renders them as. Its sibling
 * `signoffDenominatorTrackContract` names the three DENOMINATORS over those two fields instead, and
 * is the one to reach for wherever a value selects a SCOPE — "which units is this role measured
 * over".
 *
 * USAGE:
 * signoffTrackContract.parse('flowrider');
 * // Returns: SignoffTrack enum value
 *
 * A unit is done only when BOTH fields carry a sign-off — Flowrider proving it at the test layer,
 * Siegemaster proving it off the running system. Neither substitutes for the other, so neither
 * verdict is allowed to stand in for the pair.
 *
 * TWO FIELDS IS NOT TWO ROLES. Flowrider and Groundstomper both write `flowriderSignoff`, over
 * disjoint package kinds, so this list stays at two while the denominator list is three. A caller
 * that takes this enum for the role list hands Groundstomper Flowrider's scope, which is the exact
 * complement of its own.
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
