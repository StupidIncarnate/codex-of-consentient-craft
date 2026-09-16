import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
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
  // rss over the given pgids, writes the file, then read-mutate-writes the registry — the child
  // proxies below are staged in that same order, since pathJoinAdapter's mock is a single
  // call-ordered queue shared by every proxy that stages it (see
  // locations-instance-evidence-path-find-broker.proxy.ts for the same rule applied to a shorter
  // chain). `rssProxy.setupProcListing`'s own pid/statm reads DO reach real `path.join` too — that
  // is only safe called here BEFORE `registryProxy.setupCurrentRegistry`, whose own pending path
  // resolutions would otherwise be the next in this shared queue and get consumed by rss's calls
  // instead. `setupHeartbeatWrite`'s default (`setupProcMissing`) makes NO pathJoin call at all —
  // `machineRssByPgidBroker` returns `null` right after its one `/proc` `stat` check — so that path
  // carries no such ordering constraint.
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  const heartbeatPathJoinProxy = pathJoinAdapterProxy();
  const rssPathJoinProxy = pathJoinAdapterProxy();
  const rssProxy = machineRssByPgidBrokerProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const registryProxy = registryUpdateBrokerProxy();
  const dateHandle = registerSpyOn({ object: Date, method: 'now' });

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
      heartbeatPathJoinProxy.returns({ result: FilePathStub({ value: heartbeatPathValue }) });
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      // Honest default: no /proc means rssMB: null, matching InstanceHeartbeatStub's own default.
      rssProxy.setupProcMissing();

      registryProxy.setupCurrentRegistry({ json: registryJson });
      dateHandle.calledWith([]).returns(nowMs);
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
      heartbeatPathJoinProxy.returns({ result: FilePathStub({ value: heartbeatPathValue }) });
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStat({ pid, pgrp });
      rssProxy.setupPidStatm({ pid, residentPages });
      // machineRssByPgidBroker's own two per-pid joins (stat, then statm) are explicitly staged
      // here too: registryProxy.setupCurrentRegistry below queues ITS OWN pending path
      // resolutions on this same shared pathJoinAdapter mock, and an unstaged join from rss's real
      // pathJoin calls — which happen chronologically BEFORE registryUpdateBroker ever runs —
      // would otherwise consume the first two of those instead of computing its own real path.
      rssPathJoinProxy.returns({ result: FilePathStub({ value: `/proc/${pid}/stat` }) });
      rssPathJoinProxy.returns({ result: FilePathStub({ value: `/proc/${pid}/statm` }) });

      registryProxy.setupCurrentRegistry({ json: registryJson });
      dateHandle.calledWith([]).returns(nowMs);
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
      heartbeatPathJoinProxy.returns({ result: FilePathStub({ value: heartbeatPathValue }) });
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      // machineRssByPgidBroker rejects on the pid's own /proc/<pid>/stat read — the shape of one
      // unrelated process on the box throwing EACCES, not this instance's own pgids being gone.
      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStatFails({ pid, error });
      // That failing read still makes ONE real path.join call before it rejects. Staged explicitly
      // here, at this position in the shared queue, so registryProxy.setupCurrentRegistry's own
      // queued resolutions (below) land on the calls that come after it chronologically — see
      // setupHeartbeatWriteWithMeasuredRss above for the same rule applied to a successful measurement.
      rssPathJoinProxy.returns({ result: FilePathStub({ value: `/proc/${pid}/stat` }) });

      registryProxy.setupCurrentRegistry({ json: registryJson });
      dateHandle.calledWith([]).returns(nowMs);
    },

    // Echoes what setup already computed — self-documenting in a test's assertion, the same role
    // registryWriteBrokerProxy's getWrittenPath() plays for its own tmp path.
    getWrittenHeartbeatPath: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,

    getWrittenHeartbeatContent: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      writeProxy.getWrittenFor({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,
        }),
      }),

    getRegistryWrittenContent: (): unknown => registryProxy.getWrittenContent(),
  };
};
