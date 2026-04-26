import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const variantWalkLayerBrokerProxy = (): {
  setupFirstVariantMatches: (params: { configPath: FilePath }) => void;
  setupNthVariantMatches: (params: { missingPaths: FilePath[]; configPath: FilePath }) => void;
  setupAllVariantsMissing: (params: { missingPaths: FilePath[] }) => void;
} => {
  const fsAccessProxy = fsAccessAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupFirstVariantMatches: ({ configPath }: { configPath: FilePath }): void => {
      pathJoinProxy.returns({ result: configPath });
      fsAccessProxy.resolves();
    },

    setupNthVariantMatches: ({
      missingPaths,
      configPath,
    }: {
      missingPaths: FilePath[];
      configPath: FilePath;
    }): void => {
      for (const missing of missingPaths) {
        pathJoinProxy.returns({ result: missing });
        fsAccessProxy.rejects({ error: new Error('ENOENT') });
      }
      pathJoinProxy.returns({ result: configPath });
      fsAccessProxy.resolves();
    },

    setupAllVariantsMissing: ({ missingPaths }: { missingPaths: FilePath[] }): void => {
      for (const missing of missingPaths) {
        pathJoinProxy.returns({ result: missing });
        fsAccessProxy.rejects({ error: new Error('ENOENT') });
      }
    },
  };
};
