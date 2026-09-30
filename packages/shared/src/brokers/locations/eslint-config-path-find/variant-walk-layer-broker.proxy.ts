import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const variantWalkLayerBrokerProxy = (): {
  setupFirstVariantMatches: (params: { searchPath: string; configPath: string }) => void;
  setupNthVariantMatches: (params: {
    searchPath: string;
    missingPaths: string[];
    configPath: string;
  }) => void;
  setupAllVariantsMissing: (params: { searchPath: string; missingPaths: string[] }) => void;
} => {
  const fsProxy = pathExistsProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. Each candidate's own variant filename is recovered by slicing
  // it off the known searchPath prefix, so join() is staged on the EXACT (searchPath, variant)
  // tuple the broker really passes — never an address-less catch-all.
  const joinHandle = registerMock({ fn: join });

  return {
    setupFirstVariantMatches: ({
      searchPath,
      configPath,
    }: {
      searchPath: string;
      configPath: string;
    }): void => {
      const variant = configPath.slice(searchPath.length + 1);
      joinHandle.calledWith([searchPath, variant]).returns(configPath);
      fsProxy.present({ path: configPath });
    },

    setupNthVariantMatches: ({
      searchPath,
      missingPaths,
      configPath,
    }: {
      searchPath: string;
      missingPaths: string[];
      configPath: string;
    }): void => {
      for (const missing of missingPaths) {
        const missingVariant = missing.slice(searchPath.length + 1);
        joinHandle.calledWith([searchPath, missingVariant]).returns(missing);
        fsProxy.missing({ path: missing });
      }
      const variant = configPath.slice(searchPath.length + 1);
      joinHandle.calledWith([searchPath, variant]).returns(configPath);
      fsProxy.present({ path: configPath });
    },

    setupAllVariantsMissing: ({
      searchPath,
      missingPaths,
    }: {
      searchPath: string;
      missingPaths: string[];
    }): void => {
      for (const missing of missingPaths) {
        const variant = missing.slice(searchPath.length + 1);
        joinHandle.calledWith([searchPath, variant]).returns(missing);
        fsProxy.missing({ path: missing });
      }
    },
  };
};
