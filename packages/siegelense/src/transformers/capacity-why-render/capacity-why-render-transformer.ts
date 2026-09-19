/**
 * PURPOSE: Builds `capacity`'s `why` — the sentence a caller can report, and the one field that
 * makes the judgement checkable rather than trusted (siegelense-tooling.md line 1582: a pool of two
 * with no stated reason reads as a bug). Reach for this over writing a sentence at the call site:
 * every figure in it is a measured value threaded through from the same reading `measured` and
 * `profile` carry, so the prose and the blocks beside it can never disagree.
 *
 * Figures are named in MB, where the spec's illustrative sentence uses GB. One decimal of GB cannot
 * be reconciled with `measured.freeMemMB` — and the spec's own example cannot be made consistent
 * either way, since 5320MB reads as 5.2GB only on a 1024 divisor while 2600MB reads as 2.6GB only
 * on a 1000 one. The sentence's stated job is that the arithmetic be recomputable, so it names the
 * same units the answer does. Headroom is named for the same reason: it is the one term in the
 * division that appears nowhere else in the answer.
 *
 * USAGE:
 * capacityWhyRenderTransformer({ specName, profile, suggestion, freeMemMB, siegeInstances, reservedInstances });
 * // Returns 'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; free RAM 5320MB
 * // less 512MB headroom; 1 siege instance already up'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { CapacityProfile } from '../../contracts/capacity-profile/capacity-profile-contract';
import type { CapacitySuggestion } from '../../contracts/capacity-suggestion/capacity-suggestion-contract';
import type { Megabytes } from '../../contracts/megabytes/megabytes-contract';
import type { ReadingCount } from '../../contracts/reading-count/reading-count-contract';
import type { SpecName } from '../../contracts/spec-name/spec-name-contract';
import { capacityStatics } from '../../statics/capacity/capacity-statics';

const CLAUSE_SEPARATOR = '; ';

export const capacityWhyRenderTransformer = ({
  specName,
  profile,
  suggestion,
  freeMemMB,
  siegeInstances,
  reservedInstances,
}: {
  specName: SpecName;
  profile: CapacityProfile | null;
  suggestion: CapacitySuggestion;
  freeMemMB: Megabytes;
  siegeInstances: ReadingCount;
  reservedInstances: ReadingCount;
}): ContentText => {
  const { headroomMB } = capacityStatics.memory;
  const peakMB = profile === null ? 0 : profile.peakMB;
  const reservedDebitMB = peakMB * reservedInstances;

  const profileClause =
    profile === null
      ? `no measured profile for ${specName}, so the default pair of ${capacityStatics.noProfile.suggested} profiles itself`
      : `profile ${profile.peakMB}MB peak / ${profile.steadyMB}MB steady at pool size ${profile.poolSize}, from ${profile.fromRuns} runs`;

  const memoryClause =
    reservedDebitMB === 0
      ? `free RAM ${freeMemMB}MB less ${headroomMB}MB headroom`
      : `free RAM ${freeMemMB}MB less ${headroomMB}MB headroom and ${reservedDebitMB}MB for ${reservedInstances} still booting`;

  const reservingSuffix = reservedInstances === 0 ? '' : ` (${reservedInstances} still reserving)`;
  const instancesClause =
    siegeInstances === 0
      ? 'nothing else up'
      : `${siegeInstances} siege instance${siegeInstances === 1 ? '' : 's'} already up${reservingSuffix}`;

  // The first of the three that holds is the one reported: running out of memory is the case the
  // OS answers by killing something at random (line 1589), so it outranks a policy cap that is
  // only ever a knob.
  const limitClauses = [
    suggestion.memoryAllows === 0
      ? `no room for one more: ${suggestion.availableMB}MB available is under the ${peakMB}MB this spec peaks at`
      : null,
    suggestion.ceilingLeft === 0 ? `the policy pool of ${suggestion.ceiling} is full` : null,
    suggestion.ceilingLeft < suggestion.memoryAllows
      ? `capped at the policy ceiling of ${suggestion.ceiling}`
      : null,
  ];
  const limitClause = limitClauses.find((candidate) => candidate !== null) ?? null;

  return contentTextContract.parse(
    [
      profileClause,
      memoryClause,
      instancesClause,
      ...(limitClause === null ? [] : [limitClause]),
    ].join(CLAUSE_SEPARATOR),
  );
};
