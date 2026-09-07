import { join, dirname } from 'path';

import {
  pathJoinAdapterProxy,
  pathDirnameAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath, PathSegment, FileContents } from '@dungeonmaster/shared/contracts';

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const packageScaffoldWriteBrokerProxy = (): {
  setupTargetMissing: (params: {
    packageRoot: FilePath;
    files: readonly { relativePath: PathSegment; contents: FileContents }[];
  }) => void;
  setupTargetExists: (params: { packageRoot: FilePath }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupTargetMissing: ({ packageRoot, files }): void => {
      existsProxy.returns({ filePath: packageRoot, result: false });

      for (const file of files) {
        const absolutePath = FilePathStub({ value: join(packageRoot, file.relativePath) });
        const parentDir = FilePathStub({ value: dirname(absolutePath) });

        mkdirProxy.succeeds({ filePath: parentDir });
        writeProxy.succeeds({ filePath: absolutePath });
      }
    },

    setupTargetExists: ({ packageRoot }): void => {
      existsProxy.returns({ filePath: packageRoot, result: true });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
