import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const gatewayPackageRecordLayerBrokerProxy = (): {
  setupPackageJson: (params: {
    npmPackageRoot: string;
    packageJson: Record<string, unknown>;
  }) => void;
  writtenPackageJson: (params: { npmPackageRoot: string }) => unknown;
} => {
  const fileProxy = readFileProxy();
  const writeProxy = writeFileProxy();

  return {
    setupPackageJson: ({ npmPackageRoot, packageJson }): void => {
      const path = `${npmPackageRoot}/package.json`;
      fileProxy.returns({ path, contents: JSON.stringify(packageJson) });
      writeProxy.succeeds({ path });
    },
    writtenPackageJson: ({ npmPackageRoot }): unknown =>
      writeProxy.writtenContentsFor({ path: `${npmPackageRoot}/package.json` }),
  };
};
