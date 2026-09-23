/**
 * PURPOSE: Names the verification TRACK a value is scoped to or measured over — a
 * `get-qa-checklist` caller naming its own remainder, a coverage row on the quest summary, a debt
 * entry's own track. Reach for this wherever a value selects a scope: "which role, and which units
 * is it measured over".
 *
 * USAGE:
 * verificationTrackContract.parse('flowrider');
 * // Returns: VerificationTrack enum value
 *
 * ONE MEMBER PER FAMILY `stepScopeStatics.byFamilyStep` (`@dungeonmaster/orchestrator`) KEYS ITS
 * DENOMINATORS BY. That table is where each family's flow types, unit kinds, package kinds and
 * observable origins live, per step; this enum is declared here, in `verificationTracksStatics`,
 * because a shared contract cannot import an orchestrator static. `questSummaryBuildTransformer`
 * indexes by these same three names, so a member with no matching family is a COMPILE error there.
 */

import { z } from 'zod';

import { verificationTracksStatics } from '../../statics/verification-tracks/verification-tracks-statics';

export const verificationTrackContract = z.enum(verificationTracksStatics.roles);

export type VerificationTrack = z.infer<typeof verificationTrackContract>;
