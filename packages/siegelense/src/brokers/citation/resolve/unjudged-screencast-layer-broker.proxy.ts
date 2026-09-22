import { readdir } from 'fs/promises';

import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRunPathsFindBrokerProxy } from '../../locations/run-paths-find/locations-run-paths-find-broker.proxy';

export const unjudgedScreencastLayerBrokerProxy = (): {
  setupEvidenceTree: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
  setupRunDir: (params: { dirPath: AbsoluteFilePath; entries: readonly string[] }) => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  locationsRunPathsFindBrokerProxy();
  pathJoinAdapterProxy();

  // A run directory a test did not describe answers ENOENT, which is what the real tree answers for
  // a run that recorded nothing — and `fsReaddirAdapter` turns exactly that into `[]`. It is a
  // FUNCTION matcher so an exact-path `setupRunDir` staged afterwards outranks it, which is what
  // keeps "this run has a screencast" and "this one has none" describable in the same test.
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

    setupRunDir: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      readdirProxy.resolves({ dirPath, entries });
    },
  };
};
