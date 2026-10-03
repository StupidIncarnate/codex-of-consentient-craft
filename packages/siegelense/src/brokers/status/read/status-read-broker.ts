/**
 * PURPOSE: Answers `status` — `{}` for the whole fleet, `{ instanceId }` for one instance in full
 * (siegelense-tooling.md line 2376). `monitored` is DERIVED from `machineStatics.monitored`, never
 * re-listed, so the vocabulary a session can ask about has one source. A fleet listing resolves every
 * registry row's state and delegates each to `instanceEntryLayerBroker` with `named: false`, so
 * evidence and a last step never appear for an instance the caller has not already named
 * (chunk-03-read-path-and-perception.md §3.D, spec line 2380 — the no-browsing rule). Naming an id
 * that is not in the registry answers `instances: []` rather than inventing a row or throwing: an
 * unrecognised id is exactly `instanceStateResolveBroker`'s `'unknown'` case, which carries no entry
 * to build a row from. That row-less case is exactly what would make a named query byte-identical to
 * an empty fleet's own `instances: []` — `queriedInstanceState` on the returned answer is the fix:
 * the resolved state of the NAMED id (`'unknown'` included) for a named query, `null` for a fleet
 * listing where no single id was asked about (siegelense-tooling.md:2317, 2319-2321).
 *
 * A RESERVATION (`isReservedRegistryEntryGuard`) ALWAYS bypasses the `--since` window, fresh or
 * stale alike — the default 6h fleet view otherwise hides exactly the row an operator most needs to
 * notice: one abandoned before `boot.lock` or the driver's own first `ping` ever fired has no
 * heartbeat and no evidence of its own, so its own age is the only signal anything went wrong, and a
 * time window built for "how far back do you want to look at real activity" silently swallows it
 * instead. `instanceStateContract` has no member for "still reserving" — a closed enum, and this
 * package's ideal fix is one more member on it — so the row still surfaces under whatever
 * `instanceStateResolveBroker` already resolves it to instead: `alive` while inside
 * `instanceLifecycleStatics.reservation.staleAfterMs`, `dead` once past it.
 *
 * USAGE:
 * await statusReadBroker({ instanceId: null, repoRoot: '/repo' });
 * // Returns the whole fleet's StatusAnswer
 *
 * await statusReadBroker({ instanceId: InstanceIdStub(), repoRoot: '/repo' });
 * // Returns a StatusAnswer with at most one entry, fully populated
 */

import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { statusAnswerContract } from '../../../contracts/status-answer/status-answer-contract';
import type { StatusAnswer } from '../../../contracts/status-answer/status-answer-contract';
import { isReservedRegistryEntryGuard } from '../../../guards/is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { instanceStateResolveBroker } from '../../instance/state-resolve/instance-state-resolve-broker';
import { machineReadBroker } from '@dungeonmaster/load-balancer/brokers';
import { machineStatics } from '@dungeonmaster/load-balancer/statics';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { instanceEntryLayerBroker } from './instance-entry-layer-broker';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

const SINCE_WINDOWS_MS = {
  '1h': 3_600_000,
  '6h': 21_600_000,
  '1d': 86_400_000,
  '1wk': 604_800_000,
} as const;

export const statusReadBroker = async ({
  instanceId,
  repoRoot,
  branch = null,
  since = instanceId === null ? '6h' : null,
}: {
  instanceId: SiegeInstance['id'] | null;
  repoRoot: string;
  branch?: string | null;
  since?: '1h' | '6h' | '1d' | '1wk' | null;
}): Promise<StatusAnswer> => {
  // Resolved BEFORE machineReadBroker: machineOomCountBroker's own '/proc' + 'vmstat' join is left
  // to pathJoinAdapter's real-passthrough default (safe only once nothing else is pending on that
  // shared queue) — registryReadBroker/instanceStateResolveBroker's own path resolutions, pushed
  // onto that same mock by a composing test, have to be fully drained by real calls first.
  let entryStatePairs: readonly { entry: RegistryEntry; state: InstanceState }[] =
    instanceId === null
      ? await Promise.all(
          (await registryReadBroker()).instances.map(async (entry) => ({
            entry,
            state: (await instanceStateResolveBroker({ instanceId: entry.id })).state,
          })),
        )
      : await instanceStateResolveBroker({ instanceId }).then((resolved) =>
          resolved.entry === null
            ? ([] as readonly { entry: RegistryEntry; state: InstanceState }[])
            : [{ entry: resolved.entry, state: resolved.state }],
        );

  if (branch !== null) {
    entryStatePairs = entryStatePairs.filter((pair) => pair.entry.branch === branch);
  }

  const nowMs = Date.now();

  if (since !== null) {
    const windowMs = SINCE_WINDOWS_MS[since];
    entryStatePairs = entryStatePairs.filter((pair) => {
      // `state === 'alive'` is load-bearing here exactly as it is in capacityReadBroker and
      // instanceStartBroker's own aheadOfMe count: isReservedRegistryEntryGuard alone answers true
      // for a `killed`/`pruned` TOMBSTONE that never booted too (its own PURPOSE — "never a sixth
      // InstanceState" — assumes this check runs first), and a reaped row is exactly what the
      // --since window exists to age out.
      if (pair.entry.state === 'alive' && isReservedRegistryEntryGuard({ entry: pair.entry })) {
        return true;
      }
      const activityMs = pair.entry.lastBeatMs ?? pair.entry.reservedAtMs;
      return nowMs - activityMs <= windowMs;
    });
  }

  // A named query's entryStatePairs is empty ONLY when instanceStateResolveBroker found no
  // registry entry — its own first check pins that exact case to 'unknown'
  // (instance-state-resolve-broker.ts) — so the pair's own state covers every other named
  // resolution (alive/dead/killed/pruned), and the fallback covers the one state that leaves no
  // pair. null for a fleet listing: no single id was named, so there is no "state of the id you
  // asked about" to report.
  const queriedInstanceState: InstanceState | null =
    instanceId === null ? null : (entryStatePairs[0]?.state ?? 'unknown');

  const { homePath } = dungeonmasterHomeFindBroker();
  const machine = await machineReadBroker({ diskPath: homePath });

  const instances = await Promise.all(
    entryStatePairs.map(async ({ entry, state }) =>
      instanceEntryLayerBroker({
        entry,
        state,
        named: instanceId !== null,
        nowMs,
        oomKillsSinceBoot: machine.oomKillsSinceBoot,
        repoRoot,
      }),
    ),
  );

  return statusAnswerContract.parse({
    monitored: machineStatics.monitored.map((metric) => metric),
    machine,
    instances,
    queriedInstanceState,
  });
};
