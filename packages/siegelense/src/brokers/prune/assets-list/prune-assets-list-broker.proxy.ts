import { readdir, stat } from 'fs/promises';

import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsPruneAssetPathsFindBrokerProxy } from '../../locations/prune-asset-paths-find/locations-prune-asset-paths-find-broker.proxy';
import { runShotsLayerBrokerProxy } from './run-shots-layer-broker.proxy';

export const pruneAssetsListBrokerProxy = (): {
  setupEvidenceTree: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
  setupDir: (params: { dirPath: AbsoluteFilePath; entries: readonly string[] }) => void;
  setupFile: (params: {
    filePath: AbsoluteFilePath;
    sizeBytes: number;
    modifiedAtMs: number;
  }) => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  locationsPruneAssetPathsFindBrokerProxy();
  runShotsLayerBrokerProxy();
  pathJoinAdapterProxy();

  // The broker stats nine instance-level paths on EVERY call — six process records and three
  // capture buffers — and a fixture describes only the ones it wrote. This floor answers ENOENT for
  // every path a test did not describe, which is what the real tree answers for them. It is
  // deliberately a FUNCTION matcher: an exact-path `setupFile` staged afterwards outranks it, so
  // describing a file still works and only the undescribed ones read as absent.
  registerMock({ fn: stat })
    .calledWith([(): boolean => true])
    .rejects(
      Object.assign(new Error('ENOENT: no such file or directory, stat'), { code: 'ENOENT' }),
    );

  // Same floor for directories, and the same reason: an instance whose evidence tree was never
  // written has no `runs/` to list, and `fsReaddirAdapter` answers `[]` for exactly that ENOENT.
  registerMock({ fn: readdir })
    .calledWith([(): boolean => true])
    .rejects(
      Object.assign(new Error('ENOENT: no such file or directory, scandir'), { code: 'ENOENT' }),
    );

  return {
    setupEvidenceTree: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });
    },

    setupDir: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      readdirProxy.resolves({ dirPath, entries });
    },

    setupFile: ({
      filePath,
      sizeBytes,
      modifiedAtMs,
    }: {
      filePath: AbsoluteFilePath;
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      statProxy.resolves({ filePath, sizeBytes, modifiedAtMs });
    },
  };
};
