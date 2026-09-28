/**
 * PURPOSE: Composes every child proxy `instanceEntryLayerBroker` reaches through — the evidence-path
 * resolution (twice: once directly, once inside `heartbeatReadBroker`), the runs-directory listing,
 * `/proc` for orphans and rss, the three known log files (api, web, driver), the repo-local symlink,
 * and the last run's transcript. Every one of those, and this broker's own joins (`runs`,
 * `api-server.log`, `web-server.log`, `driver.log`, one repo-local full path per log that passed its
 * presence check, and the last run's transcript), now resolve on the SAME shared `#gateway/node/path`
 * `join` mock — this broker's own joins through the sticky real-passthrough default
 * `locationsInstanceEvidencePathFindBrokerProxy` installs transitively (via
 * `locationsRootPathFindBrokerProxy`'s own `dungeonmasterHomeFindBrokerProxy`), the rest through
 * their own proxy's exact-tuple addressing — so no scenario method here stages a join, and none of
 * `instanceEntryLayerBroker`'s own setup calls depend on being made in any particular order relative
 * to each other. `setupProcListing` alone answers BOTH `orphanReadBroker`'s and
 * `machineRssByPgidBroker`'s own `/proc` readdir, since both call it with the identical `dirPath`
 * argument against the one shared mock.
 *
 * `setupProfileSolo` (whenever `state !== 'alive'`) may ALSO be called in any position: it mocks
 * `profileReadBroker` directly (`profileSoloReadLayerBrokerProxy`'s own choice, mirroring
 * `capacityReadBrokerProxy`), so it never touches the shared `pathJoinAdapter` queue every join
 * above competes on.
 *
 * USAGE:
 * const proxy = instanceEntryLayerBrokerProxy();
 * proxy.setupEvidenceDir({ homeDir, homePath, rootPath, evidencePath });
 * proxy.setupHeartbeatMissing({ homeDir, homePath, rootPath, evidencePath });
 * proxy.setupRunsDirEntries({ evidencePath, entries: [] });
 * proxy.setupShutdownReasonMissing({ evidencePath });
 * proxy.setupProcListing({ pids: [] });
 */

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import type { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import type { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';
import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { heartbeatReadBrokerProxy } from '../../heartbeat/read/heartbeat-read-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { machineRssByPgidBrokerProxy } from '../../machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy';
import { orphanReadBrokerProxy } from '../../orphan/read/orphan-read-broker.proxy';
import { shutdownReasonReadBrokerProxy } from '../../shutdown-reason/read/shutdown-reason-read-broker.proxy';
import { likelyCauseLayerBrokerProxy } from './likely-cause-layer-broker.proxy';
import { profileSoloReadLayerBrokerProxy } from './profile-solo-read-layer-broker.proxy';

type InstanceHeartbeat = ReturnType<typeof InstanceHeartbeatStub>;
type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;
type ShutdownReason = ReturnType<typeof ShutdownReasonStub>;
type SpecProfile = ReturnType<typeof SpecProfileStub>;

export const instanceEntryLayerBrokerProxy = (): {
  setupEvidenceDir: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
  setupHeartbeatMissing: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
  setupHeartbeatFound: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
    heartbeat: InstanceHeartbeat;
  }) => void;
  setupRunsDirEntries: (params: { evidencePath: FilePath; entries: readonly string[] }) => void;
  setupShutdownReasonMissing: (params: { evidencePath: FilePath }) => void;
  setupShutdownReasonFound: (params: { evidencePath: FilePath; marker: ShutdownReason }) => void;
  setupProfileSolo: (params: { profile: SpecProfile }) => void;
  setupProcListing: (params: { pids: readonly string[] }) => void;
  setupPidStat: (params: { pid: string; pgrp: number; comm?: string }) => void;
  setupPidStatm: (params: { pid: string; residentPages: number }) => void;
  setupOrphanCmdline: (params: { pid: string; argv: readonly string[] }) => void;
  setupOrphanAlive: (params: { pgid: ProcessGroupId }) => void;
  setupOrphanGone: (params: { pgid: ProcessGroupId }) => void;
  setupApiLogPresent: (params: { evidencePath: FilePath }) => void;
  setupApiLogAbsent: (params: { evidencePath: FilePath }) => void;
  setupWebLogPresent: (params: { evidencePath: FilePath }) => void;
  setupWebLogAbsent: (params: { evidencePath: FilePath }) => void;
  setupDriverLogPresent: (params: { evidencePath: FilePath }) => void;
  setupDriverLogAbsent: (params: { evidencePath: FilePath }) => void;
  setupRepoLinkResolves: (params: {
    cwdPath: string;
    linkPath: FilePath;
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
  }) => void;
  setupTranscriptLines: (params: {
    evidencePath: FilePath;
    runId: string;
    lines: readonly string[];
  }) => void;
} => {
  likelyCauseLayerBrokerProxy();
  const profileSoloProxy = profileSoloReadLayerBrokerProxy();
  const directEvidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  const heartbeatProxy = heartbeatReadBrokerProxy();
  const runsDirProxy = readdirIfExistsProxy();
  const rssProxy = machineRssByPgidBrokerProxy();
  const orphanProxy = orphanReadBrokerProxy();
  const apiLogStatProxy = fsStatAdapterProxy();
  const webLogStatProxy = fsStatAdapterProxy();
  const driverLogStatProxy = fsStatAdapterProxy();
  const repoLinkProxy = locationsRepoLinkPathFindBrokerProxy();
  const transcriptReadProxy = fsReadFileAdapterProxy();
  const shutdownReasonProxy = shutdownReasonReadBrokerProxy();

  return {
    setupEvidenceDir: (params: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
    }): void => {
      directEvidencePathProxy.setupInstanceEvidencePath(params);
    },

    setupHeartbeatMissing: (params: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
    }): void => {
      heartbeatProxy.setupHeartbeatMissing(params);
    },

    setupHeartbeatFound: (params: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
      heartbeat: InstanceHeartbeat;
    }): void => {
      heartbeatProxy.setupHeartbeatFound(params);
    },

    setupRunsDirEntries: ({
      evidencePath,
      entries,
    }: {
      evidencePath: FilePath;
      entries: readonly string[];
    }): void => {
      runsDirProxy.returns({
        path: `${evidencePath}/${locationsStatics.siegelense.runsDir}`,
        names: [...entries],
      });
    },

    setupShutdownReasonMissing: ({ evidencePath }: { evidencePath: FilePath }): void => {
      shutdownReasonProxy.setupMarkerMissing({
        evidencePath: AbsoluteFilePathStub({ value: String(evidencePath) }),
      });
    },

    setupShutdownReasonFound: ({
      evidencePath,
      marker,
    }: {
      evidencePath: FilePath;
      marker: ShutdownReason;
    }): void => {
      shutdownReasonProxy.setupMarkerFound({
        evidencePath: AbsoluteFilePathStub({ value: String(evidencePath) }),
        marker,
      });
    },

    setupProfileSolo: ({ profile }: { profile: SpecProfile }): void => {
      profileSoloProxy.setupProfile({ profile });
    },

    setupProcListing: (params: { pids: readonly string[] }): void => {
      rssProxy.setupProcListing(params);
    },

    // orphanReadBroker's and machineRssByPgidBroker's own per-pid `/proc` joins resolve on
    // `#gateway/node/path`'s own `join` mock, each through its own proxy's sticky real-passthrough
    // default, so there is nothing to stage here for either.
    setupPidStat: (params: { pid: string; pgrp: number; comm?: string }): void => {
      rssProxy.setupPidStat(params);
    },

    setupPidStatm: (params: { pid: string; residentPages: number }): void => {
      rssProxy.setupPidStatm(params);
    },

    setupOrphanCmdline: (params: { pid: string; argv: readonly string[] }): void => {
      orphanProxy.setupCmdline(params);
    },

    setupOrphanAlive: (params: { pgid: ProcessGroupId }): void => {
      orphanProxy.setupAlive(params);
    },

    setupOrphanGone: (params: { pgid: ProcessGroupId }): void => {
      orphanProxy.setupGone(params);
    },

    setupApiLogPresent: ({ evidencePath }: { evidencePath: FilePath }): void => {
      apiLogStatProxy.resolves({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.apiLog}`,
        }),
        sizeBytes: 1,
        modifiedAtMs: 0,
      });
    },

    setupApiLogAbsent: ({ evidencePath }: { evidencePath: FilePath }): void => {
      apiLogStatProxy.rejects({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.apiLog}`,
        }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupWebLogPresent: ({ evidencePath }: { evidencePath: FilePath }): void => {
      webLogStatProxy.resolves({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.webLog}`,
        }),
        sizeBytes: 1,
        modifiedAtMs: 0,
      });
    },

    setupWebLogAbsent: ({ evidencePath }: { evidencePath: FilePath }): void => {
      webLogStatProxy.rejects({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.webLog}`,
        }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupDriverLogPresent: ({ evidencePath }: { evidencePath: FilePath }): void => {
      driverLogStatProxy.resolves({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.driverLog}`,
        }),
        sizeBytes: 1,
        modifiedAtMs: 0,
      });
    },

    setupDriverLogAbsent: ({ evidencePath }: { evidencePath: FilePath }): void => {
      driverLogStatProxy.rejects({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.driverLog}`,
        }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupRepoLinkResolves: (params: {
      cwdPath: string;
      linkPath: FilePath;
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
    }): void => {
      repoLinkProxy.setupLinkResolvesToRoot(params);
    },

    setupTranscriptLines: ({
      evidencePath,
      runId,
      lines,
    }: {
      evidencePath: FilePath;
      runId: string;
      lines: readonly string[];
    }): void => {
      transcriptReadProxy.resolves({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.runsDir}/${runId}.jsonl`,
        }),
        content: lines.length === 0 ? '' : `${lines.join('\n')}\n`,
      });
    },
  };
};
