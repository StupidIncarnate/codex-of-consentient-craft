import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { join } from '#gateway/node/path';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { leaseBeatBrokerProxy } from '@dungeonmaster/load-balancer/brokers/lease/beat/lease-beat-broker.proxy';
import { machineRssByPgidBrokerProxy } from '@dungeonmaster/load-balancer/brokers/machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy';
import { machineStatics } from '@dungeonmaster/load-balancer/statics';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

const DEFAULT_OWNER_PID = 1234;
const DEFAULT_TIMESTAMP_MS = 1_700_000_000_000;

export const heartbeatWriteBrokerProxy = (): {
  setupHeartbeatWrite: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
    registryJson: string;
    nowMs: number;
  }) => void;
  setupHeartbeatWriteWithMeasuredRss: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
    registryJson: string;
    nowMs: number;
    pid: string;
    pgrp: number;
    residentPages: number;
  }) => void;
  setupHeartbeatWriteWithRssMeasurementFailure: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
    registryJson: string;
    nowMs: number;
    pid: string;
    error: Error;
  }) => void;
  setupLease: (params: { leaseId: string; ownerPid?: number }) => void;
  getLeaseState: (params: { leaseId: string }) => string | undefined;
  getWrittenHeartbeatPath: (params: { evidencePath: string }) => unknown;
  getWrittenHeartbeatContent: (params: { evidencePath: string }) => unknown;
  getRegistryWrittenContent: () => unknown;
} => {
  // heartbeatWriteBroker resolves the evidence dir, joins the heartbeat filename onto it, measures
  // rss over the given pgids, writes the file, then read-mutate-writes the registry.
  // `machineRssByPgidBroker` and (transitively, via `registryUpdateBrokerProxy`)
  // `registryWriteBroker` are both migrated too, so every join in this chain — this file's own
  // evidence+heartbeat join, rss's two per-pid `/proc` joins, and registry's own tmp-path join —
  // resolves on the SAME shared `#gateway/node/path` `join` mock, each addressed by its own exact
  // tuple. Exact-tuple addressing is order-independent (unlike the old shared `pathJoinAdapter`
  // one-shot queue this used to ride), so `rssProxy`'s two joins below can be staged in any position
  // relative to `registryProxy.setupCurrentRegistry`.
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  // Shares the same '#gateway/node/path' join handle evidencePathProxy's own constructor registers
  // — addressed below on this file's OWN exact tuple, never a bare `calledWith([])`.
  const joinHandle = registerMock({ fn: join });
  const rssProxy = machineRssByPgidBrokerProxy();
  const leaseBeatProxy = leaseBeatBrokerProxy();
  const writeProxy = writeFileProxy();
  const registryProxy = registryUpdateBrokerProxy();
  const clockProxy = nowProxy();
  stderrProxy();

  const { database: leaseDatabase } = leaseBeatProxy.setupDatabase();

  return {
    setupHeartbeatWrite: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
      registryJson,
      nowMs,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
      registryJson: string;
      nowMs: number;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });

      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(heartbeatPathValue);
      writeProxy.succeeds({ path: heartbeatPathValue });

      // Honest default: no /proc means rssMB: null, matching InstanceHeartbeatStub's own default.
      rssProxy.setupProcMissing();

      registryProxy.setupCurrentRegistry({ json: registryJson });
      clockProxy.setupNow({ ms: nowMs });
    },

    setupHeartbeatWriteWithMeasuredRss: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
      registryJson,
      nowMs,
      pid,
      pgrp,
      residentPages,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
      registryJson: string;
      nowMs: number;
      pid: string;
      pgrp: number;
      residentPages: number;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });

      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(heartbeatPathValue);
      writeProxy.succeeds({ path: heartbeatPathValue });

      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStat({ pid, pgrp });
      rssProxy.setupPidStatm({ pid, residentPages });
      joinHandle
        .calledWith([machineStatics.procfs.root, pid, machineStatics.procfs.stat])
        .returns(`/proc/${pid}/stat`);
      joinHandle
        .calledWith([machineStatics.procfs.root, pid, machineStatics.procfs.statm])
        .returns(`/proc/${pid}/statm`);

      registryProxy.setupCurrentRegistry({ json: registryJson });
      clockProxy.setupNow({ ms: nowMs });
    },

    setupHeartbeatWriteWithRssMeasurementFailure: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
      registryJson,
      nowMs,
      pid,
      error,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
      registryJson: string;
      nowMs: number;
      pid: string;
      error: Error;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });

      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(heartbeatPathValue);
      writeProxy.succeeds({ path: heartbeatPathValue });

      // machineRssByPgidBroker rejects on the pid's own /proc/<pid>/stat read — the shape of one
      // unrelated process on the box throwing EACCES, not this instance's own pgids being gone.
      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStatFails({ pid, error });
      // That failing read still makes ONE real path.join call before it rejects.
      joinHandle
        .calledWith([machineStatics.procfs.root, pid, machineStatics.procfs.stat])
        .returns(`/proc/${pid}/stat`);

      registryProxy.setupCurrentRegistry({ json: registryJson });
      clockProxy.setupNow({ ms: nowMs });
    },

    setupLease: ({
      leaseId,
      ownerPid = DEFAULT_OWNER_PID,
    }: {
      leaseId: string;
      ownerPid?: number;
    }): void => {
      const insert = leaseDatabase.prepare(
        'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      );
      insert.run(
        leaseId,
        'siegelense',
        'inst-test',
        ownerPid,
        'starting',
        null,
        null,
        DEFAULT_TIMESTAMP_MS,
        DEFAULT_TIMESTAMP_MS,
      );
    },

    getLeaseState: ({ leaseId }: { leaseId: string }): string | undefined => {
      const row = leaseDatabase
        .prepare('SELECT state FROM leases WHERE lease_id = ?;')
        .get(leaseId) as { state: string } | undefined;
      return row?.state;
    },

    // Echoes what setup already computed — self-documenting in a test's assertion, the same role
    // registryWriteBrokerProxy's getWrittenPath() plays for its own tmp path.
    getWrittenHeartbeatPath: ({ evidencePath }: { evidencePath: string }): unknown =>
      `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,

    getWrittenHeartbeatContent: ({ evidencePath }: { evidencePath: string }): unknown =>
      writeProxy.writtenContentsFor({
        path: `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,
      }),

    getRegistryWrittenContent: (): unknown => registryProxy.getWrittenContent(),
  };
};
