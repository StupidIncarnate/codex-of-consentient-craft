import type { join } from 'path';
import { requireActual } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fsEnsureWriteAdapterProxy } from '../../../adapters/fs/ensure-write/fs-ensure-write-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsSymlinkAdapterProxy } from '../../../adapters/fs/symlink/fs-symlink-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath, PathSegment } from '@dungeonmaster/shared/contracts';

export const installAgentsSetupBrokerProxy = (): {
  setupSuccess: (params: { targetProjectRoot: FilePath }) => void;
  setupWriteSuccess: (params: { filepath: FilePath; contents: FileContents }) => void;
  setupFileExists: (params: { filePath: FilePath; exists: boolean }) => void;
  setupSymlinkSuccess: (params: { target: PathSegment | FilePath }) => void;
  getWrittenFor: (params: { filepath: FilePath }) => unknown;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
} => {
  const writeProxy = fsEnsureWriteAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const symlinkProxy = fsSymlinkAdapterProxy();
  const actualPath = requireActual<{ join: typeof join }>({ module: 'path' });

  const setupSuccess = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): void => {
    const hooksPath = FilePathStub({
      value: actualPath.join(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.hooksJson,
      ),
    });
    const skillsPath = FilePathStub({
      value: actualPath.join(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.skillsJson,
      ),
    });
    const rulesPath = FilePathStub({
      value: actualPath.join(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.rulesDir,
        locationsStatics.repoRoot.agents.dungeonmasterRulesMd,
      ),
    });

    writeProxy.succeeds({ filepath: hooksPath, contents: FileContentsStub() });
    writeProxy.succeeds({ filepath: skillsPath, contents: FileContentsStub() });
    writeProxy.succeeds({ filepath: rulesPath, contents: FileContentsStub() });
  };

  return {
    setupSuccess,
    setupWriteSuccess: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }): void => {
      writeProxy.succeeds({ filepath, contents });
    },
    setupFileExists: ({ filePath, exists }: { filePath: FilePath; exists: boolean }): void => {
      existsProxy.returns({ filePath, exists });
    },
    setupSymlinkSuccess: ({ target }: { target: PathSegment | FilePath }): void => {
      symlinkProxy.succeeds({ target });
    },
    getWrittenFor: ({ filepath }: { filepath: FilePath }): unknown =>
      writeProxy.getWrittenFor({ filepath }),
    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      symlinkProxy.getAllSymlinks(),
  };
};
