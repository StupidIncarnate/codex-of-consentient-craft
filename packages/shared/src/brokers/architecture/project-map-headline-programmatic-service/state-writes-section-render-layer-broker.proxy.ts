import { architectureStateWritesBrokerProxy } from '../state-writes/architecture-state-writes-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const stateWritesSectionRenderLayerBrokerProxy = (): {
  setupEmpty: () => void;
  setupSourceFiles: ({
    filePaths,
    contents,
    stateDirNames,
  }: {
    filePaths: AbsoluteFilePath[];
    contents: ContentText[];
    stateDirNames: string[];
  }) => void;
} => {
  const stateProxy = architectureStateWritesBrokerProxy();

  return {
    setupEmpty: (): void => {
      stateProxy.setupEmpty();
    },

    setupSourceFiles: ({
      filePaths,
      contents,
      stateDirNames,
    }: {
      filePaths: AbsoluteFilePath[];
      contents: ContentText[];
      stateDirNames: string[];
    }): void => {
      stateProxy.setupSourceFiles({ filePaths, contents, stateDirNames });
    },
  };
};
