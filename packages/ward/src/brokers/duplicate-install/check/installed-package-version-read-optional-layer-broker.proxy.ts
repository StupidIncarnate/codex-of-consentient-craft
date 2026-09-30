import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const installedPackageVersionReadOptionalLayerBrokerProxy = (): {
  setupInstalled: (params: { packageJsonPath: string; version: string }) => void;
  setupMissing: (params: { packageJsonPath: string }) => void;
  setupPermissionDenied: (params: { packageJsonPath: string }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupInstalled: ({
      packageJsonPath,
      version,
    }: {
      packageJsonPath: string;
      version: string;
    }): void => {
      fsProxy.returns({ path: packageJsonPath, contents: JSON.stringify({ version }) });
    },
    setupMissing: ({ packageJsonPath }: { packageJsonPath: string }): void => {
      fsProxy.missing({ path: packageJsonPath });
    },
    setupPermissionDenied: ({ packageJsonPath }: { packageJsonPath: string }): void => {
      fsProxy.denied({ path: packageJsonPath });
    },
  };
};
