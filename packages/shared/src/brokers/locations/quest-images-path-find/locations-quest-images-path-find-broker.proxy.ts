import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsQuestImagesPathFindBrokerProxy = (): {
  setupQuestImagesPath: (params: { questImagesPath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestImagesPath: ({ questImagesPath }: { questImagesPath: FilePath }): void => {
      pathJoinProxy.returns({ result: questImagesPath });
    },
  };
};
