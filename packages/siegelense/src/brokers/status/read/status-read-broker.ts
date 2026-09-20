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
 * USAGE:
 * await statusReadBroker({ instanceId: null });
 * // Returns the whole fleet's StatusAnswer
 *
 * await statusReadBroker({ instanceId: InstanceIdStub() });
 * // Returns a StatusAnswer with at most one entry, fully populated
 */

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { instanceStateContract } from '../../../contracts/instance-state/instance-state-contract';
import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';
import { monitoredMetricContract } from '../../../contracts/monitored-metric/monitored-metric-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { statusAnswerContract } from '../../../contracts/status-answer/status-answer-contract';
import type { StatusAnswer } from '../../../contracts/status-answer/status-answer-contract';
import { instanceStateResolveBroker } from '../../instance/state-resolve/instance-state-resolve-broker';
import { machineReadBroker } from '../../machine/read/machine-read-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { machineStatics } from '../../../statics/machine/machine-statics';
import { instanceEntryLayerBroker } from './instance-entry-layer-broker';

const SINCE_WINDOWS_MS = {
  '1h': 3_600_000,
  '6h': 21_600_000,
  '1d': 86_400_000,
} as const;

export const statusReadBroker = async ({
  instanceId,
  branch = null,
  since = instanceId === null ? '6h' : null,
}: {
  instanceId: InstanceId | null;
  branch?: string | null;
  since?: '1h' | '6h' | '1d' | 'beginning' | null;
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

  const nowMs = epochMsContract.parse(Date.now());

  if (since !== null && since !== 'beginning') {
    const windowMs = SINCE_WINDOWS_MS[since];
    entryStatePairs = entryStatePairs.filter((pair) => {
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
    instanceId === null
      ? null
      : (entryStatePairs[0]?.state ?? instanceStateContract.parse('unknown'));

  const machine = await machineReadBroker();

  const instances = await Promise.all(
    entryStatePairs.map(async ({ entry, state }) =>
      instanceEntryLayerBroker({
        entry,
        state,
        named: instanceId !== null,
        nowMs,
        oomKillsSinceBoot: machine.oomKillsSinceBoot,
      }),
    ),
  );

  return statusAnswerContract.parse({
    monitored: machineStatics.monitored.map((metric) => monitoredMetricContract.parse(metric)),
    machine,
    instances,
    queriedInstanceState,
  });
};
