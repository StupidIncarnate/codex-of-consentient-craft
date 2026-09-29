import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { join } from '#gateway/node/path';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { machineStatics } from '../../../statics/machine/machine-statics';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { machineRssByPgidBrokerProxy } from '../../machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

export const heartbeatWriteBrokerProxy = (): {
  setupHeartbeatWrite: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
  }) => void;
  setupHeartbeatWriteWithMeasuredRss: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
    pid: string;
    pgrp: number;
    residentPages: number;
  }) => void;
  setupHeartbeatWriteWithRssMeasurementFailure: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
    pid: string;
    error: Error;
  }) => void;
  getWrittenHeartbeatPath: (params: { evidencePath: FilePath }) => unknown;
  getWrittenHeartbeatContent: (params: { evidencePath: FilePath }) => unknown;
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
  const writeProxy = writeFileProxy();
  const registryProxy = registryUpdateBrokerProxy();
  const clockProxy = nowProxy();
  stderrProxy();

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
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });

      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
      writeProxy.succeeds({ path: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

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
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
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
        .returns(FilePathStub({ value: heartbeatPathValue }));
      writeProxy.succeeds({ path: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStat({ pid, pgrp });
      rssProxy.setupPidStatm({ pid, residentPages });
      joinHandle
        .calledWith([machineStatics.procfs.root, pid, machineStatics.procfs.stat])
        .returns(FilePathStub({ value: `/proc/${pid}/stat` }));
      joinHandle
        .calledWith([machineStatics.procfs.root, pid, machineStatics.procfs.statm])
        .returns(FilePathStub({ value: `/proc/${pid}/statm` }));

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
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
      pid: string;
      error: Error;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });

      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
      writeProxy.succeeds({ path: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      // machineRssByPgidBroker rejects on the pid's own /proc/<pid>/stat read — the shape of one
      // unrelated process on the box throwing EACCES, not this instance's own pgids being gone.
      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStatFails({ pid, error });
      // That failing read still makes ONE real path.join call before it rejects.
      joinHandle
        .calledWith([machineStatics.procfs.root, pid, machineStatics.procfs.stat])
        .returns(FilePathStub({ value: `/proc/${pid}/stat` }));

      registryProxy.setupCurrentRegistry({ json: registryJson });
      clockProxy.setupNow({ ms: nowMs });
    },

    // Echoes what setup already computed — self-documenting in a test's assertion, the same role
    // registryWriteBrokerProxy's getWrittenPath() plays for its own tmp path.
    getWrittenHeartbeatPath: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,

    getWrittenHeartbeatContent: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      writeProxy.writtenContentsFor({
        path: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,
        }),
      }),

    getRegistryWrittenContent: (): unknown => registryProxy.getWrittenContent(),
  };
};
