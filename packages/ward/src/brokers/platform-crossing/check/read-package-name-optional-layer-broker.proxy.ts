import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const readPackageNameOptionalLayerBrokerProxy = (): {
  setupPackageJson: (params: { packageJsonPath: string; name: string }) => void;
  setupMissing: (params: { packageJsonPath: string }) => void;
  setupPermissionDenied: (params: { packageJsonPath: string }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupPackageJson: ({
      packageJsonPath,
      name,
    }: {
      packageJsonPath: string;
      name: string;
    }): void => {
      fsProxy.returns({ path: packageJsonPath, contents: JSON.stringify({ name }) });
    },
    setupMissing: ({ packageJsonPath }: { packageJsonPath: string }): void => {
      fsProxy.missing({ path: packageJsonPath });
    },
    setupPermissionDenied: ({ packageJsonPath }: { packageJsonPath: string }): void => {
      fsProxy.denied({ path: packageJsonPath });
    },
  };
};
