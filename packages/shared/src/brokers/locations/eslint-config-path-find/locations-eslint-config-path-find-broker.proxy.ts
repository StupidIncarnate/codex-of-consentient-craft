import { variantWalkLayerBrokerProxy } from './variant-walk-layer-broker.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsEslintConfigPathFindBrokerProxy = (): {
  setupConfigFoundAtFirstVariant: (params: { searchPath: string; configPath: FilePath }) => void;
  setupConfigFoundAtNonFirstVariant: (params: {
    searchPath: string;
    missingPaths: FilePath[];
    configPath: FilePath;
  }) => void;
  setupConfigFoundAtParentDirectory: (params: {
    childPaths: string[];
    parentPaths: string[];
    parentConfigPath: FilePath;
    parentMissingPaths: FilePath[];
  }) => void;
  setupAllVariantsMissingThenParentNotFound: (params: { searchPath: string }) => void;
} => {
  const variantWalkProxy = variantWalkLayerBrokerProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();

  return {
    setupConfigFoundAtFirstVariant: ({
      searchPath: _searchPath,
      configPath,
    }: {
      searchPath: string;
      configPath: FilePath;
    }): void => {
      variantWalkProxy.setupFirstVariantMatches({ configPath });
    },

    setupConfigFoundAtNonFirstVariant: ({
      searchPath: _searchPath,
      missingPaths,
      configPath,
    }: {
      searchPath: string;
      missingPaths: FilePath[];
      configPath: FilePath;
    }): void => {
      variantWalkProxy.setupNthVariantMatches({ missingPaths, configPath });
    },

    setupConfigFoundAtParentDirectory: ({
      childPaths,
      parentPaths,
      parentConfigPath,
      parentMissingPaths,
    }: {
      childPaths: string[];
      parentPaths: string[];
      parentConfigPath: FilePath;
      parentMissingPaths: FilePath[];
    }): void => {
      // Walk-up loop: at each child dir, all 4 variants miss, then dirname returns parent.
      for (const childDir of childPaths) {
        variantWalkProxy.setupAllVariantsMissing({
          missingPaths: [
            `${childDir}/eslint.config.ts` as never,
            `${childDir}/eslint.config.js` as never,
            `${childDir}/eslint.config.mjs` as never,
            `${childDir}/eslint.config.cjs` as never,
          ],
        });
      }
      // Stage dirname returns to walk from each child to its parent.
      for (const parent of parentPaths) {
        pathDirnameProxy.returns({ result: parent as never });
      }
      // At the final parent: any preceding misses (e.g., .ts) reject, then config is found.
      variantWalkProxy.setupNthVariantMatches({
        missingPaths: parentMissingPaths,
        configPath: parentConfigPath,
      });
    },

    setupAllVariantsMissingThenParentNotFound: ({ searchPath }: { searchPath: string }): void => {
      variantWalkProxy.setupAllVariantsMissing({
        missingPaths: [
          `${searchPath}/eslint.config.ts` as never,
          `${searchPath}/eslint.config.js` as never,
          `${searchPath}/eslint.config.mjs` as never,
          `${searchPath}/eslint.config.cjs` as never,
        ],
      });
      pathDirnameProxy.returns({ result: searchPath as never });
    },
  };
};
