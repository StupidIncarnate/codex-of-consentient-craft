import { join } from '#gateway/node/path';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

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
  // heartbeatWriteBroker resolves the evidence dir, joins the heartbeat filename onto it (staged on
  // `#gateway/node/path`'s own `join` mock, addressed below by its own exact tuple — never the
  // shared `pathJoinAdapter` queue), measures rss over the given pgids, writes the file, then
  // read-mutate-writes the registry. `rssProxy` (`machineRssByPgidBroker`) and `registryProxy`
  // (transitively, `registryWriteBroker`) still resolve their own joins through that OTHER, shared
  // `pathJoinAdapter` mock (neither is migrated here) — but this file no longer imports
  // `pathJoinAdapter` itself, so `enforce-proxy-child-creation` forbids composing its proxy directly
  // here. `rssProxy.setupPidStatPathJoinDefensive`/`setupPidStatmPathJoinDefensive` (below, in
  // `setupHeartbeatWriteWithMeasuredRss`/`setupHeartbeatWriteWithRssMeasurementFailure`) reach that
  // SAME shared mock through `machineRssByPgidBrokerProxy`'s own, already-legitimate composition
  // instead — `registryProxy.setupCurrentRegistry` (called last in each method) queues ITS OWN
  // pending resolution on it, and an unstaged real join from rss's calls, which run chronologically
  // BEFORE registryUpdateBroker, would otherwise consume that instead of computing its own real path.
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  // Shares the same '#gateway/node/path' join handle evidencePathProxy's own constructor registers
  // — addressed below on this file's OWN exact tuple, never a bare `calledWith([])`.
  const joinHandle = registerMock({ fn: join });
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
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
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
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStat({ pid, pgrp });
      rssProxy.setupPidStatm({ pid, residentPages });
      rssProxy.setupPidStatPathJoinDefensive({ pid });
      rssProxy.setupPidStatmPathJoinDefensive({ pid });

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
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      // machineRssByPgidBroker rejects on the pid's own /proc/<pid>/stat read — the shape of one
      // unrelated process on the box throwing EACCES, not this instance's own pgids being gone.
      rssProxy.setupProcListing({ pids: [pid] });
      rssProxy.setupPidStatFails({ pid, error });
      // That failing read still makes ONE real path.join call before it rejects.
      rssProxy.setupPidStatPathJoinDefensive({ pid });

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
