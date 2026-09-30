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
 * `requestedPoolSize` is the raw `--pool` value, before `capacityReadBroker` resolves it to the
 * policy ceiling or hands it to `capacitySampleSelectTransformer`. It never changes `suggested`; it
 * only decides whether a second clause is owed. With no measured profile at all, `--pool` cannot
 * pick anything — the default pair is the whole answer regardless of what was asked, and a caller
 * who does not hear that reads a coincidence (`--pool 2` matching the default) as proof the flag
 * did something. With a profile but no group at exactly that pool size,
 * `capacitySampleSelectTransformer` already substitutes the nearest measured group silently; this is
 * the only place that substitution becomes visible. `capacityAnswerRenderTransformer` extracts the
 * spec name by matching `/no measured profile for ([^,]+)/u` against this string, so the no-profile
 * clause keeps `specName` immediately followed by a comma.
 *
 * `cores` and `loadAvg1` back the CPU clause the same way `freeMemMB` backs the memory one — named
 * so the arithmetic in `suggestion.cpuAllows` is recomputable, not merely asserted. It only appears
 * when CPU is the tightest of the three limits (`capacitySuggestTransformer`'s
 * `min(memoryAllows, cpuAllows, ceilingLeft)`), the same "first one that binds" rule the memory and
 * policy clauses already follow.
 *
 * USAGE:
 * capacityWhyRenderTransformer({ specName, profile, suggestion, freeMemMB, siegeInstances, reservedInstances, requestedPoolSize, cores, loadAvg1 });
 * // Returns 'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; free RAM 5320MB
 * // less 512MB headroom; 1 siege instance already up'
 */

import type { CapacityMeasured } from '../../contracts/capacity-measured/capacity-measured-contract';
import type { CapacityProfile } from '../../contracts/capacity-profile/capacity-profile-contract';
import type { CapacitySuggestion } from '../../contracts/capacity-suggestion/capacity-suggestion-contract';
import { capacityStatics } from '../../statics/capacity/capacity-statics';

const CLAUSE_SEPARATOR = '; ';

export const capacityWhyRenderTransformer = ({
  specName,
  profile,
  suggestion,
  freeMemMB,
  siegeInstances,
  reservedInstances,
  requestedPoolSize,
  cores,
  loadAvg1,
}: {
  specName: string;
  profile: CapacityProfile | null;
  suggestion: CapacitySuggestion;
  freeMemMB: number;
  siegeInstances: number;
  reservedInstances: number;
  requestedPoolSize: number | null;
  cores: number;
  loadAvg1: CapacityMeasured['loadAvg1'];
}): string => {
  const { headroomMB } = capacityStatics.memory;
  const peakMB = profile === null ? 0 : profile.peakMB;
  const reservedDebitMB = peakMB * reservedInstances;
  const { suggested: defaultSuggested } = capacityStatics.noProfile;

  const ignoredPoolNote =
    requestedPoolSize === null ? '' : ` --pool ${requestedPoolSize} has no effect:`;

  const profileClause =
    profile === null
      ? `no measured profile for ${specName}, so${ignoredPoolNote} this suggests the default of ${defaultSuggested} instances; run a pool of ${defaultSuggested} once and siegelense records a profile for next time`
      : `profile ${profile.peakMB}MB peak / ${profile.steadyMB}MB steady at pool size ${profile.poolSize}, from ${profile.fromRuns} runs`;

  const poolMismatchClause =
    profile !== null && requestedPoolSize !== null && requestedPoolSize !== profile.poolSize
      ? `--pool ${requestedPoolSize} has no measured group, so pool size ${profile.poolSize} was used instead`
      : null;

  const memoryClause =
    reservedDebitMB === 0
      ? `free RAM ${freeMemMB}MB less ${headroomMB}MB headroom`
      : `free RAM ${freeMemMB}MB less ${headroomMB}MB headroom and ${reservedDebitMB}MB for ${reservedInstances} still booting`;

  const reservingSuffix = reservedInstances === 0 ? '' : ` (${reservedInstances} still reserving)`;
  const instancesClause =
    siegeInstances === 0
      ? 'nothing else up'
      : `${siegeInstances} siege instance${siegeInstances === 1 ? '' : 's'} already up${reservingSuffix}`;

  // The first of these that holds is the one reported. Running out of memory is the case the OS
  // answers by killing something at random (line 1589), so it outranks everything else; a fully
  // booked policy pool is the next hardest stop. CPU is checked before the generic policy-cap
  // clause so a load-driven number says load, not "policy", caused it.
  const limitClauses = [
    suggestion.memoryAllows === 0
      ? `no room for one more: ${suggestion.availableMB}MB available is under the ${peakMB}MB this spec peaks at`
      : null,
    suggestion.ceilingLeft === 0 ? `the policy pool of ${suggestion.ceiling} is full` : null,
    suggestion.cpuAllows < suggestion.memoryAllows && suggestion.cpuAllows <= suggestion.ceilingLeft
      ? `load ${loadAvg1} across ${cores} cores allows only ${suggestion.cpuAllows}; CPU, not memory, is the limit`
      : null,
    suggestion.ceilingLeft < Math.min(suggestion.memoryAllows, suggestion.cpuAllows)
      ? `capped at the policy ceiling of ${suggestion.ceiling}`
      : null,
  ];
  const limitClause = limitClauses.find((candidate) => candidate !== null) ?? null;

  return [
    profileClause,
    ...(poolMismatchClause === null ? [] : [poolMismatchClause]),
    memoryClause,
    instancesClause,
    ...(limitClause === null ? [] : [limitClause]),
  ].join(CLAUSE_SEPARATOR);
};
