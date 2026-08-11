/**
 * PURPOSE: Names the verification DENOMINATORS — the answer to "which units is THIS ROLE measured
 * over". Reach for this wherever a value selects a scope: a `get-qa-checklist` caller naming its
 * own remainder, a coverage row on the quest summary, the completion gate resolving what it refuses
 * a `done` on. Its sibling `signoffTrackContract` names the two sign-off FIELDS instead, and is the
 * one to reach for wherever a value selects a COLUMN to read or write.
 *
 * USAGE:
 * signoffDenominatorTrackContract.parse('groundstomper');
 * // Returns: SignoffDenominatorTrack enum value
 *
 * THERE ARE THREE DENOMINATORS OVER TWO FIELDS, and conflating the two lists is what left
 * Groundstomper unable to ask for its own number. Flowrider and Groundstomper both WRITE
 * `flowriderSignoff`, over `packageTypes` that are disjoint and whose union is Siegemaster's — so
 * neither settles the other's units and a role handed the other's denominator reads the exact
 * complement of its own work.
 *
 * ONE MEMBER PER `signoffTrackEligibilityStatics.byTrack` KEY. That statics object is where each
 * denominator's flow types, unit kinds, package kinds, package slice rule and observable origins
 * live; this enum is its key set, declared in `signoffTracksStatics` because a shared contract
 * cannot import an orchestrator static. The two are pinned in both directions: the eligibility
 * statics' colocated test compares its keys against that tuple, and
 * `questSummaryBuildTransformer` indexes `byTrack` with these options, so a member with no entry is
 * additionally a COMPILE error there.
 */

import { z } from 'zod';

import { signoffTracksStatics } from '../../statics/signoff-tracks/signoff-tracks-statics';

export const signoffDenominatorTrackContract = z.enum(signoffTracksStatics.denominators);

export type SignoffDenominatorTrack = z.infer<typeof signoffDenominatorTrackContract>;
