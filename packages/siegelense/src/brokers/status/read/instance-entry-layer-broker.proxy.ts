/**
 * PURPOSE: Composes every child proxy `instanceEntryLayerBroker` reaches through — the evidence-path
 * resolution (twice: once directly, once inside `heartbeatReadBroker`), the runs-directory listing,
 * `/proc` for orphans and rss, the repo-local symlink, the evidence-directory walk, and the last
 * run's transcript — behind scenario methods a test calls in any order: every child mock is
 * addressed by its own path, and this broker's own joins resolve on `#gateway/node/path`'s real
 * `join`, which no scenario method stages. `setupEvidenceTreeDir` stages one directory level of the
 * evidence walk, keyed on the REAL home path; a level nobody stages reads as absent only after
 * `setupEvidenceTreeMissingDir` says so. `setupProcListing` alone answers BOTH `orphanReadBroker`'s
 * and `machineRssByPgidBroker`'s own `/proc` readdir, since both call it with the identical
 * `dirPath` argument against the one shared mock.
 *
 * `setupProfileSolo` (whenever `state !== 'alive'`) mocks `profileReadBroker` directly
 * (`profileSoloReadLayerBrokerProxy`'s own choice, mirroring `capacityReadBrokerProxy`).
 *
 * USAGE:
 * const proxy = instanceEntryLayerBrokerProxy();
 * proxy.setupEvidenceDir({ homeDir, homePath, rootPath, evidencePath });
 * proxy.setupHeartbeatMissing({ homeDir, homePath, rootPath, evidencePath });
 * proxy.setupRunsDirEntries({ evidencePath, entries: [] });
 * proxy.setupShutdownReasonMissing({ evidencePath });
 * proxy.setupProcListing({ pids: [] });
 */

import { locationsStatics } from '@dungeonmaster/shared/statics';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import type { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import type { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';
import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { heartbeatReadBrokerProxy } from '../../heartbeat/read/heartbeat-read-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { machineRssByPgidBrokerProxy } from '../../machine/rss-by-pgid/machine-rss-by-pgid-broker.proxy';
import { orphanReadBrokerProxy } from '../../orphan/read/orphan-read-broker.proxy';
import { shutdownReasonReadBrokerProxy } from '../../shutdown-reason/read/shutdown-reason-read-broker.proxy';
import { evidenceTreeLayerBrokerProxy } from './evidence-tree-layer-broker.proxy';
import { likelyCauseLayerBrokerProxy } from './likely-cause-layer-broker.proxy';
import { profileSoloReadLayerBrokerProxy } from './profile-solo-read-layer-broker.proxy';

type InstanceHeartbeat = ReturnType<typeof InstanceHeartbeatStub>;
type ProcessGroupId = number;
type ShutdownReason = ReturnType<typeof ShutdownReasonStub>;
type SpecProfile = ReturnType<typeof SpecProfileStub>;

export const instanceEntryLayerBrokerProxy = (): {
  setupEvidenceDir: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
  }) => void;
  setupHeartbeatMissing: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
  }) => void;
  setupHeartbeatFound: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
    heartbeat: InstanceHeartbeat;
  }) => void;
  setupRunsDirEntries: (params: { evidencePath: string; entries: readonly string[] }) => void;
  setupShutdownReasonMissing: (params: { evidencePath: string }) => void;
  setupShutdownReasonFound: (params: { evidencePath: string; marker: ShutdownReason }) => void;
  setupProfileSolo: (params: { profile: SpecProfile }) => void;
  setupProcListing: (params: { pids: readonly string[] }) => void;
  setupPidStat: (params: { pid: string; pgrp: number; comm?: string }) => void;
  setupPidStatm: (params: { pid: string; residentPages: number }) => void;
  setupOrphanCmdline: (params: { pid: string; argv: readonly string[] }) => void;
  setupOrphanAlive: (params: { pgid: ProcessGroupId }) => void;
  setupOrphanGone: (params: { pgid: ProcessGroupId }) => void;
  setupRepoLinkResolves: (params: {
    repoRoot: string;
    linkPath: string;
    homeDir: string;
    homePath: string;
    rootPath: string;
  }) => void;
  setupEvidenceTreeDir: (params: {
    dirPath: string;
    files: readonly { name: string; bytes: number }[];
    dirs?: readonly string[];
  }) => void;
  setupEvidenceTreeMissingDir: (params: { dirPath: string }) => void;
  setupTranscriptLines: (params: {
    evidencePath: string;
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
  const evidenceTreeProxy = evidenceTreeLayerBrokerProxy();
  const repoLinkProxy = locationsRepoLinkPathFindBrokerProxy();
  const transcriptReadProxy = readFileProxy();
  const shutdownReasonProxy = shutdownReasonReadBrokerProxy();

  return {
    setupEvidenceDir: (params: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
    }): void => {
      directEvidencePathProxy.setupInstanceEvidencePath(params);
    },

    setupHeartbeatMissing: (params: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
    }): void => {
      heartbeatProxy.setupHeartbeatMissing(params);
    },

    setupHeartbeatFound: (params: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
      heartbeat: InstanceHeartbeat;
    }): void => {
      heartbeatProxy.setupHeartbeatFound(params);
    },

    setupRunsDirEntries: ({
      evidencePath,
      entries,
    }: {
      evidencePath: string;
      entries: readonly string[];
    }): void => {
      runsDirProxy.returns({
        path: `${evidencePath}/${locationsStatics.siegelense.runsDir}`,
        names: [...entries],
      });
    },

    setupShutdownReasonMissing: ({ evidencePath }: { evidencePath: string }): void => {
      shutdownReasonProxy.setupMarkerMissing({
        evidencePath,
      });
    },

    setupShutdownReasonFound: ({
      evidencePath,
      marker,
    }: {
      evidencePath: string;
      marker: ShutdownReason;
    }): void => {
      shutdownReasonProxy.setupMarkerFound({
        evidencePath,
        marker,
      });
    },

    setupProfileSolo: ({ profile }: { profile: SpecProfile }): void => {
      profileSoloProxy.setupProfile({ profile });
    },

    setupProcListing: (params: { pids: readonly string[] }): void => {
      rssProxy.setupProcListing(params);
    },

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

    setupRepoLinkResolves: (params: {
      repoRoot: string;
      linkPath: string;
      homeDir: string;
      homePath: string;
      rootPath: string;
    }): void => {
      repoLinkProxy.setupLinkResolvesToRoot(params);
    },

    setupEvidenceTreeDir: (params: {
      dirPath: string;
      files: readonly { name: string; bytes: number }[];
      dirs?: readonly string[];
    }): void => {
      evidenceTreeProxy.setupDir(params);
    },

    setupEvidenceTreeMissingDir: (params: { dirPath: string }): void => {
      evidenceTreeProxy.setupMissingDir(params);
    },

    setupTranscriptLines: ({
      evidencePath,
      runId,
      lines,
    }: {
      evidencePath: string;
      runId: string;
      lines: readonly string[];
    }): void => {
      transcriptReadProxy.returns({
        path: `${evidencePath}/${locationsStatics.siegelense.runsDir}/${runId}.jsonl`,
        contents: lines.length === 0 ? '' : `${lines.join('\n')}\n`,
      });
    },
  };
};
