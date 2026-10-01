import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

import { bundleBuildBrokerProxy } from '../build/bundle-build-broker.proxy';

// The sha-256 of the three files bundleBuildBrokerProxy's single-package fixture stages, in sorted
// path order relative to the package root. Editing any of those contents changes this number.
const BUNDLE_HASH = '1d36195dbed4d762ee44bad0c0a391b267a8b412c2832995e82a59b16fe9d184';

export const bundleBuildForIntegrationBrokerProxy = (): {
  setupNoManifest: (params: { packageRoot: string }) => void;
  setupManifest: (params: { packageRoot: string; contents: string }) => void;
  setupOptedInWithCachedBundle: (params: { packageRoot: string }) => void;
  bundleDirFor: (params: { packageRoot: string }) => string;
} => {
  const readProxy = readFileProxy();
  const bundleProxy = bundleBuildBrokerProxy();

  return {
    setupNoManifest: ({ packageRoot }: { packageRoot: string }): void => {
      readProxy.missing({ path: `${packageRoot}/package.json` });
    },

    // One manifest answers every read of it: this broker's own, and the build-script and
    // dependency reads bundleBuildBroker makes after it.
    setupManifest: ({ packageRoot, contents }: { packageRoot: string; contents: string }): void => {
      readProxy.returns({ path: `${packageRoot}/package.json`, contents });
    },

    // Staged after the bundle fixture, so this manifest is the one every read of it sees. Its name
    // and empty dependency list are the ones that fixture's closure walk expects.
    setupOptedInWithCachedBundle: ({ packageRoot }: { packageRoot: string }): void => {
      bundleProxy.setupCachedSinglePackageBundle({ packageRoot, hash: BUNDLE_HASH });
      readProxy.returns({
        path: `${packageRoot}/package.json`,
        contents: JSON.stringify({
          name: 'bundled',
          scripts: { build: 'tsc -p tsconfig.build.json' },
          ward: { integrationBuild: true },
        }),
      });
    },

    bundleDirFor: ({ packageRoot }: { packageRoot: string }): string =>
      bundleProxy.bundleDirFor({ packageRoot, hash: BUNDLE_HASH }),
  };
};
