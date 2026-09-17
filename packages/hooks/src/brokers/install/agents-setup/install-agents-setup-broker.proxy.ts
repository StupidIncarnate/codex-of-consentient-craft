import type { join } from 'path';
import { requireActual } from '@dungeonmaster/testing/register-mock';
import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsEnsureWriteAdapterProxy } from '../../../adapters/fs/ensure-write/fs-ensure-write-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const installAgentsSetupBrokerProxy = (): {
  setupSuccess: (params: { targetProjectRoot: FilePath }) => void;
  setupWriteSuccess: (params: { filepath: FilePath; contents: FileContents }) => void;
  setupFileExists: (params: { filePath: FilePath; exists: boolean }) => void;
  getWrittenFor: (params: { filepath: FilePath }) => unknown;
} => {
  const joinProxy = pathJoinAdapterProxy();
  const writeProxy = fsEnsureWriteAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const { join: realJoin } = requireActual<{ join: typeof join }>({ module: 'path' });

  joinProxy
    .getHandle()
    .calledWith([])
    .implement((...segments) => realJoin(...segments));

  const setupSuccess = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): void => {
    const hooksPath = FilePathStub({
      value: realJoin(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.hooksJson,
      ),
    });
    const skillsPath = FilePathStub({
      value: realJoin(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.skillsJson,
      ),
    });
    const rulesPath = FilePathStub({
      value: realJoin(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.pluginsDir,
        mcpToolsStatics.server.name,
        locationsStatics.repoRoot.agents.rulesDir,
        locationsStatics.repoRoot.agentsMd,
      ),
    });
    const agentsMdPath = FilePathStub({
      value: realJoin(targetProjectRoot, locationsStatics.repoRoot.agentsMd),
    });

    writeProxy.succeeds({ filepath: hooksPath, contents: FileContentsStub() });
    writeProxy.succeeds({ filepath: skillsPath, contents: FileContentsStub() });
    writeProxy.succeeds({ filepath: rulesPath, contents: FileContentsStub() });
    writeProxy.succeeds({ filepath: agentsMdPath, contents: FileContentsStub() });
  };

  return {
    setupSuccess,
    setupWriteSuccess: ({
      filepath,
      contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      writeProxy.succeeds({ filepath, contents });
    },
    setupFileExists: ({ filePath, exists }: { filePath: FilePath; exists: boolean }): void => {
      existsProxy.returns({ filePath, exists });
    },
    getWrittenFor: ({ filepath }: { filepath: FilePath }): unknown =>
      writeProxy.getWrittenFor({ filepath }),
  };
};
