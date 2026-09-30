/**
 * PURPOSE: Copies dungeonmaster's own gateway source for one folder (node or browser) into a
 * consumer's freshly scaffolded `packages/@gateway/<folder>`, so the consumer starts with every
 * wrapper, proxy, stub and test this repo has, as its own code to change. The source comes from the
 * INSTALLED `@dungeonmaster/<folder>` package, found by resolving one of its exported subpaths —
 * the same lookup works through this repo's workspace symlink and a consumer's `node_modules`.
 *
 * USAGE:
 * await gatewaySourceCopyBroker({ folder: 'node', packageRoot: FilePathStub({ value: '/repo/packages/@gateway/node' }) });
 * // Copies @dungeonmaster/node's src/ into /repo/packages/@gateway/node/src; returns the directories written
 */

import { resolvePackageRoot } from '#gateway/node/module';
import { cp } from '#gateway/node/fs__promises';
import {
  gatewaySourceCopyStatics,
  type GatewayCopiedFolder,
} from '../../../statics/gateway-source-copy/gateway-source-copy-statics';

export const gatewaySourceCopyBroker = async ({
  folder,
  packageRoot,
}: {
  folder: GatewayCopiedFolder;
  packageRoot: string;
}): Promise<readonly string[]> => {
  const { specifier, directories } = gatewaySourceCopyStatics.sources[folder];
  const sourceRoot = resolvePackageRoot({ specifier });

  if (sourceRoot === null) {
    throw new Error(
      `Cannot copy the ${folder} gateway into ${packageRoot}: ${specifier} does not resolve from the installed dungeonmaster`,
    );
  }

  return Promise.all(
    directories.map(async (directory) => {
      const destination = `${packageRoot}/${directory}`;
      await cp(`${sourceRoot}/${directory}`, destination, { recursive: true });
      return destination;
    }),
  );
};
