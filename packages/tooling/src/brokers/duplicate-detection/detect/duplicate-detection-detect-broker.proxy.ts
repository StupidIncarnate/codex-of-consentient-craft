import { globProxy } from '#gateway/npm/glob/glob/glob.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { typescriptParseBrokerProxy } from '../../typescript/parse/typescript-parse-broker.proxy';
import { globIgnoreStatics } from '../../../statics/glob-ignore/glob-ignore-statics';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';

export const duplicateDetectionDetectBrokerProxy = (): {
  setupFiles: (params: {
    pattern: GlobPattern;
    cwd?: AbsoluteFilePath;
    files: readonly { filePath: AbsoluteFilePath; sourceCode: SourceCode }[];
  }) => void;
} => {
  const globHandle = globProxy();
  const readFileHandle = readFileProxy();
  typescriptParseBrokerProxy();

  return {
    setupFiles: ({
      pattern,
      cwd,
      files,
    }: {
      pattern: GlobPattern;
      cwd?: AbsoluteFilePath;
      files: readonly { filePath: AbsoluteFilePath; sourceCode: SourceCode }[];
    }): void => {
      const filePaths = files.map(({ filePath }) => filePath);
      globHandle.returns({
        pattern,
        options: {
          ...(cwd === undefined ? {} : { cwd }),
          nodir: false,
          ignore: globIgnoreStatics.defaults,
        },
        matches: [...filePaths],
      });

      for (const { filePath, sourceCode } of files) {
        readFileHandle.returns({ path: filePath, contents: sourceCode });
      }
    },
  };
};
