import { variantWalkLayerBrokerProxy } from './variant-walk-layer-broker.proxy';
import { dirname } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const locationsHookConfigPathFindBrokerProxy = (): {
  setupConfigFoundAtFirstVariant: (params: { configPath: string }) => void;
  setupConfigFoundAtLaterVariant: (params: {
    searchPath: string;
    matchingVariant: '.js' | '.mjs' | '.cjs';
  }) => void;
  setupConfigFoundInAncestor: (params: { startPath: string; ancestorPath: string }) => void;
  setupAllVariantsMissingThenParentNotFound: (params: { searchPath: string }) => void;
} => {
  const variantWalkProxy = variantWalkLayerBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const dirnameHandle = registerMock({ fn: dirname });

  const variantOrder = ['.ts', '.js', '.mjs', '.cjs'] as const;

  const buildAllMissing = ({ searchPath }: { searchPath: string }): string[] =>
    variantOrder.map((variant) => `${searchPath}/.dungeonmaster-hooks.config${variant}` as never);

  return {
    setupConfigFoundAtFirstVariant: ({ configPath }: { configPath: string }): void => {
      const searchPath = configPath.slice(0, configPath.lastIndexOf('/'));
      variantWalkProxy.setupFirstVariantMatches({ searchPath, configPath });
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
        searchPath,
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
        searchPath: startPath,
        missingPaths: buildAllMissing({ searchPath: startPath }),
      });
      dirnameHandle.calledWith([startPath]).returns(ancestorPath);
      variantWalkProxy.setupFirstVariantMatches({
        searchPath: ancestorPath,
        configPath: `${ancestorPath}/.dungeonmaster-hooks.config.ts` as never,
      });
    },

    setupAllVariantsMissingThenParentNotFound: ({ searchPath }: { searchPath: string }): void => {
      variantWalkProxy.setupAllVariantsMissing({
        searchPath,
        missingPaths: buildAllMissing({ searchPath }),
      });
      // Reached root: dirname(searchPath) === searchPath, so the broker throws.
      dirnameHandle.calledWith([searchPath]).returns(searchPath);
    },
  };
};
