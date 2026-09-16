/**
 * PURPOSE: Answers `status` — `{}` for the whole fleet, `{ instanceId }` for one instance in full
 * (siegelense-tooling.md line 2376). `monitored` is DERIVED from `machineStatics.monitored`, never
 * re-listed, so the vocabulary a session can ask about has one source. A fleet listing resolves every
 * registry row's state and delegates each to `instanceEntryLayerBroker` with `named: false`, so
 * evidence and a last step never appear for an instance the caller has not already named
 * (chunk-03-read-path-and-perception.md §3.D, spec line 2380 — the no-browsing rule). Naming an id
 * that is not in the registry answers `instances: []` rather than inventing a row or throwing: an
 * unrecognised id is exactly `instanceStateResolveBroker`'s `'unknown'` case, which carries no entry
 * to build a row from.
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

export const statusReadBroker = async ({
  instanceId,
}: {
  instanceId: InstanceId | null;
}): Promise<StatusAnswer> => {
  // Resolved BEFORE machineReadBroker: machineOomCountBroker's own '/proc' + 'vmstat' join is left
  // to pathJoinAdapter's real-passthrough default (safe only once nothing else is pending on that
  // shared queue) — registryReadBroker/instanceStateResolveBroker's own path resolutions, pushed
  // onto that same mock by a composing test, have to be fully drained by real calls first.
  const entryStatePairs: readonly { entry: RegistryEntry; state: InstanceState }[] =
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

  const machine = await machineReadBroker();
  const nowMs = epochMsContract.parse(Date.now());

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
  });
};
