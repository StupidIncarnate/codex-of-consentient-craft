import { stat } from 'fs/promises';

import { join } from '#gateway/node/path';
import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsPruneAssetPathsFindBrokerProxy } from '../../locations/prune-asset-paths-find/locations-prune-asset-paths-find-broker.proxy';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import { runShotsLayerBrokerProxy } from './run-shots-layer-broker.proxy';

const VIDEO_DIR_SUFFIX = `/${evidenceFileStatics.naming.videoDir}`;

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
  const readdirProxy = readdirIfExistsProxy();
  const statProxy = fsStatAdapterProxy();
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  locationsPruneAssetPathsFindBrokerProxy();
  runShotsLayerBrokerProxy();
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — a run
  // file's own path is a plain `path.join(runsDir, fileName)`.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

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

  // The broker lists the instance's video directory on EVERY call, and only a lane that recorded a
  // screencast has one. This floor answers ENOENT for any video directory a test did not describe,
  // which is what the real tree answers; an exact-path `setupDir` staged afterwards outranks it.
  readdirProxy.throwsMatchingPath({
    path: (value: unknown): boolean => String(value).endsWith(VIDEO_DIR_SUFFIX),
    error: FsErrorStub({ code: 'ENOENT', path: evidenceFileStatics.naming.videoDir }),
  });

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
      readdirProxy.returns({ path: dirPath, names: [...entries] });
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
