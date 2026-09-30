/**
 * PURPOSE: Renders `status`'s `likelyCause` sentence — EVIDENCE, never a verdict
 * (siegelense-tooling.md line 1193: "'memory 2980MB against a 2600MB profile peak, kernel OOM kill
 * at 20:11:04' is evidence a session can weigh. 'It ran out of memory' is a claim it cannot"). A
 * recorded `shutdownReason` IS such evidence — a fact the driver, or a reaping caller, wrote about
 * what ended the instance before its lane tore down, e.g. an idle-timeout self-reap or a `cleanup`
 * sweep finding a stale heartbeat — so it is returned AS-IS, with no memory/profile/OOM recital
 * appended: a recorded reason for the shutdown already says what happened, and offering a memory
 * story too turns a clear answer into a padded one. Absent that, this falls back to reading the
 * memory recorded at the instance's last beat, `soloProfile` — the spec's OWN measured solo (pool
 * size 1) reading, resolved by `profileSoloReadLayerBroker` the SAME way `capacityReadBroker`
 * resolves a profile — and the machine's kernel OOM-kill count: the only evidence there is for a
 * death nothing explained. `null` for a LIVE instance either way — nothing went wrong, so a cause
 * would be an invention (chunk-03-read-path-and-perception.md §3.D).
 *
 * USAGE:
 * likelyCauseLayerBroker({
 *   state: InstanceStateStub({ value: 'dead' }),
 *   specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
 *   rssAtLastBeat: MegabytesStub({ value: 2980 }),
 *   oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
 *   shutdownReason: null,
 *   soloProfile: null,
 * });
 * // Returns 'memory 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel
 * // OOM kills since boot: 2' as ContentText
 *
 * likelyCauseLayerBroker({
 *   state: InstanceStateStub({ value: 'dead' }),
 *   specName: SpecNameStub({ value: 'stack' }),
 *   rssAtLastBeat: MegabytesStub({ value: 609 }),
 *   oomKillsSinceBoot: ReadingCountStub({ value: 0 }),
 *   shutdownReason: null,
 *   soloProfile: CapacityProfileStub({ spec: 'stack', poolSize: 1, steadyMB: 488, peakMB: 609, fromRuns: 5 }),
 * });
 * // Returns 'memory 609MB at last beat; profile 609MB peak / 488MB steady at pool size 1, from 5
 * // runs; kernel OOM kills since boot: 0' as ContentText
 *
 * likelyCauseLayerBroker({
 *   state: InstanceStateStub({ value: 'dead' }),
 *   specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
 *   rssAtLastBeat: MegabytesStub({ value: 622 }),
 *   oomKillsSinceBoot: ReadingCountStub({ value: 1 }),
 *   shutdownReason: ContentTextStub({ value: 'reaped by idle timeout after 900s with no run received' }),
 *   soloProfile: null,
 * });
 * // Returns 'reaped by idle timeout after 900s with no run received' as ContentText — the
 * // memory/profile/OOM reading never enters the sentence
 */


import type { CapacityProfile } from '../../../contracts/capacity-profile/capacity-profile-contract';
import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';

export const likelyCauseLayerBroker = ({
  state,
  specName,
  rssAtLastBeat,
  oomKillsSinceBoot,
  shutdownReason,
  soloProfile,
}: {
  state: InstanceState;
  specName: string;
  rssAtLastBeat: number | null;
  oomKillsSinceBoot: number | null;
  shutdownReason: string | null;
  soloProfile: CapacityProfile | null;
}): string | null => {
  if (state === 'alive') {
    return null;
  }

  if (shutdownReason !== null) {
    return shutdownReason;
  }

  const profileClause =
    soloProfile === null
      ? `no profile recorded for spec ${specName}`
      : `profile ${soloProfile.peakMB}MB peak / ${soloProfile.steadyMB}MB steady at pool size ${soloProfile.poolSize}, from ${soloProfile.fromRuns} runs`;

  const memoryPart =
    rssAtLastBeat === null
      ? 'memory unavailable at last beat'
      : `memory ${String(rssAtLastBeat)}MB at last beat; ${profileClause}`;

  const oomPart =
    oomKillsSinceBoot === null
      ? 'kernel OOM events unavailable'
      : `kernel OOM kills since boot: ${String(oomKillsSinceBoot)}`;

  return `${memoryPart}; ${oomPart}`;
};
