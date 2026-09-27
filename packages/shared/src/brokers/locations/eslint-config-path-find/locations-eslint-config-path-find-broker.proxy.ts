import { variantWalkLayerBrokerProxy } from './variant-walk-layer-broker.proxy';
import { dirname } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
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
    finalSearchPath: string;
    parentConfigPath: FilePath;
    parentMissingPaths: FilePath[];
  }) => void;
  setupAllVariantsMissingThenParentNotFound: (params: { searchPath: string }) => void;
} => {
  const variantWalkProxy = variantWalkLayerBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const dirnameHandle = registerMock({ fn: dirname });

  return {
    setupConfigFoundAtFirstVariant: ({
      searchPath,
      configPath,
    }: {
      searchPath: string;
      configPath: FilePath;
    }): void => {
      variantWalkProxy.setupFirstVariantMatches({ searchPath, configPath });
    },

    setupConfigFoundAtNonFirstVariant: ({
      searchPath,
      missingPaths,
      configPath,
    }: {
      searchPath: string;
      missingPaths: FilePath[];
      configPath: FilePath;
    }): void => {
      variantWalkProxy.setupNthVariantMatches({ searchPath, missingPaths, configPath });
    },

    setupConfigFoundAtParentDirectory: ({
      childPaths,
      parentPaths,
      finalSearchPath,
      parentConfigPath,
      parentMissingPaths,
    }: {
      childPaths: string[];
      parentPaths: string[];
      finalSearchPath: string;
      parentConfigPath: FilePath;
      parentMissingPaths: FilePath[];
    }): void => {
      // Walk-up loop: at each child dir, all 4 variants miss, then dirname returns parent.
      for (const [index, childDir] of childPaths.entries()) {
        variantWalkProxy.setupAllVariantsMissing({
          searchPath: childDir,
          missingPaths: [
            `${childDir}/eslint.config.ts` as never,
            `${childDir}/eslint.config.js` as never,
            `${childDir}/eslint.config.mjs` as never,
            `${childDir}/eslint.config.cjs` as never,
          ],
        });
        // Stage dirname on the EXACT child path it walks up from, never an address-less stage.
        const parent = parentPaths[index];
        if (parent !== undefined) {
          dirnameHandle.calledWith([childDir]).returns(parent);
        }
      }
      // At the final parent: any preceding misses (e.g., .ts) reject, then config is found.
      variantWalkProxy.setupNthVariantMatches({
        searchPath: finalSearchPath,
        missingPaths: parentMissingPaths,
        configPath: parentConfigPath,
      });
    },

    setupAllVariantsMissingThenParentNotFound: ({ searchPath }: { searchPath: string }): void => {
      variantWalkProxy.setupAllVariantsMissing({
        searchPath,
        missingPaths: [
          `${searchPath}/eslint.config.ts` as never,
          `${searchPath}/eslint.config.js` as never,
          `${searchPath}/eslint.config.mjs` as never,
          `${searchPath}/eslint.config.cjs` as never,
        ],
      });
      // Reached root: dirname(searchPath) === searchPath, so the broker throws.
      dirnameHandle.calledWith([searchPath]).returns(searchPath);
    },
  };
};
