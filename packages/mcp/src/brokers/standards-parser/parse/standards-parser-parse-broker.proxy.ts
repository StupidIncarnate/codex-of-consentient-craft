import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';

export const standardsParserParseBrokerProxy = (): {
  setupMarkdownFile: ({
    filepath,
    contents,
  }: {
    filepath: FilePath;
    contents: FileContents;
  }) => void;
} => {
  const globProxy = globFindAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupMarkdownFile: ({
      filepath,
      contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      globProxy.returns({
        pattern: GlobPatternStub({ value: 'packages/standards/**/*.md' }),
        files: [filepath],
      });
      readFileProxy.returns({ filepath, contents });
    },
  };
};
