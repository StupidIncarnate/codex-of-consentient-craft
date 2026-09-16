/**
 * PURPOSE: Composes every child proxy `instanceEntryLayerBroker` reaches through — the evidence-path
 * resolution (twice: once directly, once inside `heartbeatReadBroker`), the runs-directory listing,
 * `/proc` for orphans and rss, the two known log files, the repo-local symlink, and the last run's
 * transcript — behind scenario methods a test calls in the SAME order the broker itself reaches
 * them, since `pathJoinAdapter`'s mock is one call-ordered queue shared by every proxy that stages it
 * (see `heartbeat-write-broker.proxy.ts` for the same rule on a shorter chain). Four of this broker's
 * OWN joins — `runs`, `api-server.log`, `web-server.log`, and the last run's transcript — are
 * explicitly staged here too, via `setupRunsDirPathJoin` / `setupApiWebLogPathJoins` /
 * `setupTranscriptPathJoin`, rather than left to `pathJoinAdapter`'s real-passthrough default:
 * `locationsRepoLinkPathFindBroker`'s OWN resolution (staged by `setupRepoLinkResolves`) pushes ITS
 * pending entries onto this SAME shared queue well before it actually runs, and an unstaged call
 * from this broker in between would consume one of those instead of computing its own real join. A
 * test therefore calls the push-registering methods in exactly this order: `setupEvidenceDir`,
 * `setupHeartbeatFound`/`setupHeartbeatMissing`, `setupRunsDirPathJoin`,
 * `setupApiWebLogPathJoins` (named only), `setupRepoLinkResolves` (named only),
 * `setupTranscriptPathJoin` (named, with a run, only) — the non-pushing methods
 * (`setupRunsDirEntries`, `setupProcListing`, the log presence/absence, `setupTranscriptLines`) may
 * be called in any position relative to those. `setupProcListing` alone answers BOTH
 * `orphanReadBroker`'s and `machineRssByPgidBroker`'s own `/proc` readdir, since both call it with
 * the identical `dirPath` argument against the one shared mock.
 *
 * USAGE:
 * const proxy = instanceEntryLayerBrokerProxy();
 * proxy.setupEvidenceDir({ homeDir, homePath, rootPath, evidencePath });
 * proxy.setupHeartbeatMissing({ homeDir, homePath, rootPath, evidencePath });
 * proxy.setupRunsDirPathJoin({ evidencePath });
 * proxy.setupRunsDirEntries({ evidencePath, entries: [] });
 * proxy.setupProcListing({ pids: [] });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import type { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { heartbeatReadBrokerProxy } from '../../heartbeat/read/heartbeat-read-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { machineRssByPgidBrokerProxy } from '../../machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy';
import { orphanReadBrokerProxy } from '../../orphan/read/orphan-read-broker.proxy';
import { likelyCauseLayerBrokerProxy } from './likely-cause-layer-broker.proxy';

type InstanceHeartbeat = ReturnType<typeof InstanceHeartbeatStub>;
type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

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
  setupRunsDirPathJoin: (params: { evidencePath: FilePath }) => void;
  setupRunsDirEntries: (params: { evidencePath: FilePath; entries: readonly string[] }) => void;
  setupProcListing: (params: { pids: readonly string[] }) => void;
  setupPidStatPathJoin: (params: { pid: string }) => void;
  setupPidStat: (params: { pid: string; pgrp: number; comm?: string }) => void;
  setupPidStatmPathJoin: (params: { pid: string }) => void;
  setupPidStatm: (params: { pid: string; residentPages: number }) => void;
  setupPidCmdlinePathJoin: (params: { pid: string }) => void;
  setupOrphanCmdline: (params: { pid: string; argv: readonly string[] }) => void;
  setupOrphanAlive: (params: { pgid: ProcessGroupId }) => void;
  setupOrphanGone: (params: { pgid: ProcessGroupId }) => void;
  setupApiWebLogPathJoins: (params: { evidencePath: FilePath }) => void;
  setupApiLogPresent: (params: { evidencePath: FilePath }) => void;
  setupApiLogAbsent: (params: { evidencePath: FilePath }) => void;
  setupWebLogPresent: (params: { evidencePath: FilePath }) => void;
  setupWebLogAbsent: (params: { evidencePath: FilePath }) => void;
  setupRepoLinkResolves: (params: {
    cwdPath: string;
    linkPath: FilePath;
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
  }) => void;
  setupTranscriptPathJoin: (params: { evidencePath: FilePath; runId: string }) => void;
  setupTranscriptLines: (params: {
    evidencePath: FilePath;
    runId: string;
    lines: readonly string[];
  }) => void;
} => {
  likelyCauseLayerBrokerProxy();
  const directEvidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  const heartbeatProxy = heartbeatReadBrokerProxy();
  const ownPathJoinProxy = pathJoinAdapterProxy();
  const runsDirProxy = fsReaddirAdapterProxy();
  const rssProxy = machineRssByPgidBrokerProxy();
  const orphanProxy = orphanReadBrokerProxy();
  const apiLogStatProxy = fsStatAdapterProxy();
  const webLogStatProxy = fsStatAdapterProxy();
  const repoLinkProxy = locationsRepoLinkPathFindBrokerProxy();
  const transcriptReadProxy = fsReadFileAdapterProxy();

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

    setupRunsDirPathJoin: ({ evidencePath }: { evidencePath: FilePath }): void => {
      ownPathJoinProxy.returns({
        result: FilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.runsDir}`,
        }),
      });
    },

    setupRunsDirEntries: ({
      evidencePath,
      entries,
    }: {
      evidencePath: FilePath;
      entries: readonly string[];
    }): void => {
      runsDirProxy.resolves({
        dirPath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.runsDir}`,
        }),
        entries,
      });
    },

    setupProcListing: (params: { pids: readonly string[] }): void => {
      rssProxy.setupProcListing(params);
    },

    // orphanReadBroker and (when the instance is alive) machineRssByPgidBroker each join
    // `/proc/<pid>/stat` for EVERY pid `/proc`'s own readdir returned, and that join happens only
    // after the readdir's promise resolves — i.e. from a microtask queued alongside
    // `setupRepoLinkResolves`'s own pending, not-yet-consumed entries. Unstaged, it would consume
    // one of those instead of computing its own real path, the same reason
    // `setupApiWebLogPathJoins` and `setupTranscriptPathJoin` are explicit.
    setupPidStatPathJoin: ({ pid }: { pid: string }): void => {
      ownPathJoinProxy.returns({ result: FilePathStub({ value: `/proc/${pid}/stat` }) });
    },

    setupPidStat: (params: { pid: string; pgrp: number; comm?: string }): void => {
      rssProxy.setupPidStat(params);
    },

    setupPidStatmPathJoin: ({ pid }: { pid: string }): void => {
      ownPathJoinProxy.returns({ result: FilePathStub({ value: `/proc/${pid}/statm` }) });
    },

    setupPidStatm: (params: { pid: string; residentPages: number }): void => {
      rssProxy.setupPidStatm(params);
    },

    setupPidCmdlinePathJoin: ({ pid }: { pid: string }): void => {
      ownPathJoinProxy.returns({ result: FilePathStub({ value: `/proc/${pid}/cmdline` }) });
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

    // The broker computes the api-log path THEN the web-log path — two real joins, in that order —
    // right before it calls `locationsRepoLinkPathFindBroker`, so both are pushed here together,
    // ahead of `setupRepoLinkResolves`.
    setupApiWebLogPathJoins: ({ evidencePath }: { evidencePath: FilePath }): void => {
      ownPathJoinProxy.returns({
        result: FilePathStub({ value: `${evidencePath}/${locationsStatics.siegelense.apiLog}` }),
      });
      ownPathJoinProxy.returns({
        result: FilePathStub({ value: `${evidencePath}/${locationsStatics.siegelense.webLog}` }),
      });
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

    setupRepoLinkResolves: (params: {
      cwdPath: string;
      linkPath: FilePath;
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
    }): void => {
      repoLinkProxy.setupLinkResolvesToRoot(params);
    },

    setupTranscriptPathJoin: ({
      evidencePath,
      runId,
    }: {
      evidencePath: FilePath;
      runId: string;
    }): void => {
      ownPathJoinProxy.returns({
        result: FilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.runsDir}/${runId}.jsonl`,
        }),
      });
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
