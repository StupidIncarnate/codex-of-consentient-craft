import type { dirname, join } from '#gateway/node/path';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

import { requireActual } from '@dungeonmaster/testing/register-mock';

import { packageRootFindLayerBrokerProxy } from './package-root-find-layer-broker.proxy';

const CLI_PACKAGE_NAME = '@dungeonmaster/cli';

// The broker starts from a REAL `require.resolve` of the CLI package, never mocked; this proxy
// resolves the same specifier so every path it stages is the exact one the broker will ask for.
// The path math runs on the REAL `path` functions: a composing proxy may already have mocked
// `dirname`/`join` for its own addresses.
export const cliPackageBinResolveBrokerProxy = (): {
  manifestDeclaresBin: (params: { binRelative: string }) => void;
  manifestHasNoBinField: () => void;
  packageRootDoesNotExist: () => void;
  getExpectedBinPath: (params: { binRelative: string }) => string;
} => {
  const layerProxy = packageRootFindLayerBrokerProxy();
  const readFileProxy = readFileSyncProxy();
  const realPath = requireActual<{ dirname: typeof dirname; join: typeof join }>({
    module: 'path',
  });
  const entryDir = realPath.dirname(require.resolve(CLI_PACKAGE_NAME));
  const manifestPath = realPath.join(entryDir, 'package.json');

  return {
    manifestDeclaresBin: ({ binRelative }: { binRelative: string }): void => {
      layerProxy.setupPackageJsonAt({ dirPath: entryDir, exists: true });
      readFileProxy.returns({
        path: manifestPath,
        contents: JSON.stringify({ name: CLI_PACKAGE_NAME, bin: { dungeonmaster: binRelative } }),
      });
    },

    manifestHasNoBinField: (): void => {
      layerProxy.setupPackageJsonAt({ dirPath: entryDir, exists: true });
      readFileProxy.returns({
        path: manifestPath,
        contents: JSON.stringify({ name: CLI_PACKAGE_NAME }),
      });
    },

    packageRootDoesNotExist: (): void => {
      layerProxy.setupNoPackageJsonFrom({ startDir: entryDir });
    },

    getExpectedBinPath: ({
      binRelative,
    }: {
      binRelative: string;
    }): string =>
      realPath.join(entryDir, binRelative),
  };
};
