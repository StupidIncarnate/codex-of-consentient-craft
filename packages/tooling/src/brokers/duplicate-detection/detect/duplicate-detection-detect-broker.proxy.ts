import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { typescriptParseAdapterProxy } from '../../../adapters/typescript/parse/typescript-parse-adapter.proxy';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';

export const duplicateDetectionDetectBrokerProxy = (): {
  setupFiles: (params: {
    pattern: GlobPattern;
    files: readonly { filePath: AbsoluteFilePath; sourceCode: SourceCode }[];
  }) => void;
} => {
  const globProxy = globFindAdapterProxy();
  const fsProxy = fsReadFileAdapterProxy();
  typescriptParseAdapterProxy();

  return {
    setupFiles: ({
      pattern,
      files,
    }: {
      pattern: GlobPattern;
      files: readonly { filePath: AbsoluteFilePath; sourceCode: SourceCode }[];
    }): void => {
      const filePaths = files.map(({ filePath }) => filePath);
      globProxy.returns({ pattern, filePaths });

      for (const { filePath, sourceCode } of files) {
        fsProxy.returns({ filePath, sourceCode });
      }
    },
  };
};
