import type { join } from 'path';
import { requireActual } from '@dungeonmaster/testing/register-mock';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FileContentsStub } from '@dungeonmaster/shared/contracts';
import { PathSegmentStub as FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

type FilePath = ReturnType<typeof FilePathStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const settingsPermissionsAddBrokerProxy = (): {
  setupExistingSettings: ({
    targetProjectRoot,
    settingsPath,
    contents,
  }: {
    targetProjectRoot: FilePath;
    settingsPath: FilePath;
    contents: FileContents;
  }) => void;
  setupNoExistingSettings: ({
    targetProjectRoot,
    settingsPath,
  }: {
    targetProjectRoot: FilePath;
    settingsPath: FilePath;
  }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  // join is left on its real passthrough default (path-join-adapter.proxy.ts) — the broker
  // builds settingsDir/settingsPath through it for real, so it is never staged here.
  pathJoinAdapterProxy();

  // Mirrors the broker's own settingsDir computation so the mkdir address matches what the
  // broker really calls join with, instead of an arbitrary stub.
  const actualPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const settingsDirFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    FilePathStub({
      value: actualPath.join(targetProjectRoot, locationsStatics.repoRoot.claude.dir),
    });

  return {
    setupExistingSettings: ({
      targetProjectRoot,
      settingsPath,
      contents,
    }: {
      targetProjectRoot: FilePath;
      settingsPath: FilePath;
      contents: FileContents;
    }): void => {
      mkdirProxy.succeeds({ filepath: settingsDirFor({ targetProjectRoot }) });
      readProxy.returnsFor({ filepath: settingsPath, contents });
      writeProxy.succeeds({ filepath: settingsPath });
    },
    setupNoExistingSettings: ({
      targetProjectRoot,
      settingsPath,
    }: {
      targetProjectRoot: FilePath;
      settingsPath: FilePath;
    }): void => {
      mkdirProxy.succeeds({ filepath: settingsDirFor({ targetProjectRoot }) });
      readProxy.throwsFor({ filepath: settingsPath, error: new Error('ENOENT') });
      writeProxy.succeeds({ filepath: settingsPath });
    },
  };
};
