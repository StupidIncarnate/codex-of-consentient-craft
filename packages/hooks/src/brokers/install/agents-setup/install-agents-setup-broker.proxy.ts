import { join } from '#gateway/node/path';
import { writeFileCreatingParentProxy } from '#gateway/node/fs__promises/write-file-creating-parent/write-file-creating-parent.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

type FileContents = ReturnType<typeof FileContentsStub>;
type FilePath = ReturnType<typeof FilePathStub>;

export const installAgentsSetupBrokerProxy = (): {
  setupSuccess: (params: { targetProjectRoot: FilePath }) => void;
  setupWriteSuccess: (params: { filepath: FilePath; contents: FileContents }) => void;
  setupFileExists: (params: { filePath: FilePath; exists: boolean }) => void;
  getWrittenFor: (params: { filepath: FilePath }) => unknown;
} => {
  const joinHandle = registerMock({ fn: join });
  const writeProxy = writeFileCreatingParentProxy();
  const existsProxy = existsSyncProxy();
  const { join: realJoin } = requireActual<{ join: typeof join }>({ module: 'path' });

  joinHandle.calledWith([]).implement((...segments) => realJoin(...segments));

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
    const claudeMdPath = FilePathStub({
      value: realJoin(targetProjectRoot, locationsStatics.repoRoot.claudeMd),
    });
    const agentsMdPath = FilePathStub({
      value: realJoin(targetProjectRoot, locationsStatics.repoRoot.agentsMd),
    });

    writeProxy.succeeds({ path: hooksPath });
    writeProxy.succeeds({ path: skillsPath });
    writeProxy.succeeds({ path: rulesPath });
    writeProxy.succeeds({ path: agentsMdPath });

    existsProxy.returns({ path: claudeMdPath, exists: false });
    existsProxy.returns({ path: agentsMdPath, exists: false });
  };

  return {
    setupSuccess,
    setupWriteSuccess: ({
      filepath,
      contents: _contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      writeProxy.succeeds({ path: filepath });
    },
    setupFileExists: ({ filePath, exists }: { filePath: FilePath; exists: boolean }): void => {
      existsProxy.returns({ path: filePath, exists });
    },
    getWrittenFor: ({ filepath }: { filepath: FilePath }): unknown =>
      writeProxy.writtenContentsFor({ path: filepath }),
  };
};
