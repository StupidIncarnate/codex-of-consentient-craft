import { execPathProxy } from '#gateway/node/process/exec-path/exec-path.proxy';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';

import { moduleResolveBrokerProxy } from '../../module/resolve/module-resolve-broker.proxy';

export const packageBinResolveBrokerProxy = (): {
  setupManifestInRunRoot: (params: {
    packageName: string;
    repoRoot: string;
    manifestPath: string;
    rawManifest: string;
  }) => void;
  setupManifestInOwnInstall: (params: {
    packageName: string;
    repoRoot: string;
    manifestPath: string;
    rawManifest: string;
  }) => void;
  setupPackageInstalledNowhere: (params: { packageName: string; repoRoot: string }) => void;
} => {
  execPathProxy();
  const moduleProxy = moduleResolveBrokerProxy();
  const manifestProxy = readJsonFileProxy();

  return {
    setupManifestInRunRoot: ({
      packageName,
      repoRoot,
      manifestPath,
      rawManifest,
    }: {
      packageName: string;
      repoRoot: string;
      manifestPath: string;
      rawManifest: string;
    }): void => {
      moduleProxy.setupResolvesFromRunRoot({
        specifier: `${packageName}/package.json`,
        repoRoot,
        path: manifestPath,
      });
      manifestProxy.returnsRaw({ path: manifestPath, rawContents: rawManifest });
    },

    setupManifestInOwnInstall: ({
      packageName,
      repoRoot,
      manifestPath,
      rawManifest,
    }: {
      packageName: string;
      repoRoot: string;
      manifestPath: string;
      rawManifest: string;
    }): void => {
      moduleProxy.setupResolvesFromOwnInstall({
        specifier: `${packageName}/package.json`,
        repoRoot,
        path: manifestPath,
      });
      manifestProxy.returnsRaw({ path: manifestPath, rawContents: rawManifest });
    },

    setupPackageInstalledNowhere: ({
      packageName,
      repoRoot,
    }: {
      packageName: string;
      repoRoot: string;
    }): void => {
      moduleProxy.setupResolvesNowhere({ specifier: `${packageName}/package.json`, repoRoot });
    },
  };
};
