import { variantWalkLayerBrokerProxy } from './variant-walk-layer-broker.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsHookConfigPathFindBrokerProxy = (): {
  setupConfigFoundAtFirstVariant: (params: { configPath: FilePath }) => void;
  setupConfigFoundAtLaterVariant: (params: {
    searchPath: string;
    matchingVariant: '.js' | '.mjs' | '.cjs';
  }) => void;
  setupConfigFoundInAncestor: (params: { startPath: string; ancestorPath: string }) => void;
  setupAllVariantsMissingThenParentNotFound: (params: { searchPath: string }) => void;
} => {
  const variantWalkProxy = variantWalkLayerBrokerProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();

  const variantOrder = ['.ts', '.js', '.mjs', '.cjs'] as const;

  const buildAllMissing = ({ searchPath }: { searchPath: string }): FilePath[] =>
    variantOrder.map((variant) => `${searchPath}/.dungeonmaster-hooks.config${variant}` as never);

  return {
    setupConfigFoundAtFirstVariant: ({ configPath }: { configPath: FilePath }): void => {
      variantWalkProxy.setupFirstVariantMatches({ configPath });
    },

    setupConfigFoundAtLaterVariant: ({
      searchPath,
      matchingVariant,
    }: {
      searchPath: string;
      matchingVariant: '.js' | '.mjs' | '.cjs';
    }): void => {
      const matchIndex = variantOrder.indexOf(matchingVariant);
      const missingPaths = variantOrder
        .slice(0, matchIndex)
        .map((variant) => `${searchPath}/.dungeonmaster-hooks.config${variant}` as never);
      variantWalkProxy.setupNthVariantMatches({
        missingPaths,
        configPath: `${searchPath}/.dungeonmaster-hooks.config${matchingVariant}` as never,
      });
    },

    setupConfigFoundInAncestor: ({
      startPath,
      ancestorPath,
    }: {
      startPath: string;
      ancestorPath: string;
    }): void => {
      variantWalkProxy.setupAllVariantsMissing({
        missingPaths: buildAllMissing({ searchPath: startPath }),
      });
      pathDirnameProxy.returns({ result: ancestorPath as never });
      variantWalkProxy.setupFirstVariantMatches({
        configPath: `${ancestorPath}/.dungeonmaster-hooks.config.ts` as never,
      });
    },

    setupAllVariantsMissingThenParentNotFound: ({ searchPath }: { searchPath: string }): void => {
      variantWalkProxy.setupAllVariantsMissing({
        missingPaths: buildAllMissing({ searchPath }),
      });
      pathDirnameProxy.returns({ result: searchPath as never });
    },
  };
};
