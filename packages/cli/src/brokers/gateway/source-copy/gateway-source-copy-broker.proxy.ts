import { cp } from '#gateway/node/fs__promises';
import { resolvePackageRoot } from '#gateway/node/module';
import { resolvePackageRootProxy } from '#gateway/node/module/resolve-package-root/resolve-package-root.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import {
  gatewaySourceCopyStatics,
  type GatewayCopiedFolder,
} from '../../../statics/gateway-source-copy/gateway-source-copy-statics';

export const gatewaySourceCopyBrokerProxy = (): {
  copySucceeds: (params: { folder: GatewayCopiedFolder; packageRoot: FilePath }) => void;
  copiedSources: () => readonly unknown[];
} => {
  // resolvePackageRoot runs real, against the real installed workspace packages.
  resolvePackageRootProxy();
  const cpHandle = registerMock({ fn: cp });

  return {
    // The source side is the real resolved install location, computed here the same way the broker
    // computes it, so each copy is staged by its exact source and destination.
    copySucceeds: ({ folder, packageRoot }): void => {
      const { specifier, directories } = gatewaySourceCopyStatics.sources[folder];
      const sourceRoot = resolvePackageRoot({ specifier });
      for (const directory of directories) {
        cpHandle
          .calledWith([
            `${String(sourceRoot)}/${directory}`,
            `${packageRoot}/${directory}`,
            { recursive: true },
          ])
          .resolves(undefined);
      }
    },
    copiedSources: (): readonly unknown[] => cpHandle.callsMatching([]).map(([source]) => source),
  };
};
