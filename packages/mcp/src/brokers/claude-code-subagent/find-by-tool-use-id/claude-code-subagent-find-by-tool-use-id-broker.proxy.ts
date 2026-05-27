import { FileContentsStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

export const claudeCodeSubagentFindByToolUseIdBrokerProxy = (): {
  setupHomeDir: (params: { path: string }) => void;
  setupSubagentDirFiles: (params: { files: readonly string[] }) => void;
  setupSubagentDirMissing: () => void;
  setupMetaFileContents: (params: { filename: string; contents: string }) => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
    },
    setupSubagentDirFiles: ({ files }: { files: readonly string[] }): void => {
      readdirProxy.returns({
        entries: files.map((f) => FolderNameStub({ value: f })),
      });
    },
    setupSubagentDirMissing: (): void => {
      readdirProxy.returnsUndefined();
    },
    setupMetaFileContents: ({
      filename,
      contents,
    }: {
      filename: string;
      contents: string;
    }): void => {
      readFileProxy.returns({
        filepath: PathSegmentStub({ value: filename }),
        contents: FileContentsStub({ value: contents }),
      });
    },
  };
};
