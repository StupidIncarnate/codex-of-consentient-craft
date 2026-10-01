import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { execPathProxy } from '#gateway/node/process/exec-path/exec-path.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { dirname, join } from '#gateway/node/path';

import { dungeonmasterBinStatics } from '../../../statics/dungeonmaster-bin/dungeonmaster-bin-statics';

export const dungeonmasterBinResolveBrokerProxy = (): {
  setupInstalled: (params: {
    cwd: string;
    binName: keyof typeof dungeonmasterBinStatics.packages;
    installedAt: string;
    manifestJson: string;
  }) => void;
  setupNotInstalled: (params: {
    cwd: string;
    binName: keyof typeof dungeonmasterBinStatics.packages;
  }) => void;
  setupNotInstalledAnywhere: (params: {
    binName: keyof typeof dungeonmasterBinStatics.packages;
  }) => void;
} => {
  const manifestProxy = readJsonFileIfExistsProxy();
  execPathProxy();

  const manifestPathFor = ({
    dir,
    binName,
  }: {
    dir: string;
    binName: keyof typeof dungeonmasterBinStatics.packages;
  }): string =>
    join(
      dir,
      dungeonmasterBinStatics.layout.modulesDir,
      dungeonmasterBinStatics.packages[binName],
      dungeonmasterBinStatics.layout.manifest,
    );

  // Every folder from `cwd` up to (not including) `stopAt` holds no copy of the package; with no
  // `stopAt` the walk runs out at the filesystem root.
  const stageMissingFrom = ({
    cwd,
    binName,
    stopAt,
  }: {
    cwd: string;
    binName: keyof typeof dungeonmasterBinStatics.packages;
    stopAt?: string;
  }): void => {
    const dirs = [cwd];
    while (dirs.at(-1) !== stopAt && dirname(dirs.at(-1) ?? '/') !== dirs.at(-1)) {
      dirs.push(dirname(dirs.at(-1) ?? '/'));
    }
    dirs
      .filter((dir) => dir !== stopAt)
      .forEach((dir) => {
        manifestProxy.missing({ path: manifestPathFor({ dir, binName }) });
      });
  };

  return {
    setupInstalled: ({ cwd, binName, installedAt, manifestJson }): void => {
      stageMissingFrom({ cwd, binName, stopAt: installedAt });
      manifestProxy.returnsRaw({
        path: manifestPathFor({ dir: installedAt, binName }),
        rawContents: manifestJson,
      });
    },
    setupNotInstalled: ({ cwd, binName }): void => {
      stageMissingFrom({ cwd, binName });
    },
    // For a caller whose setup does not know the run folder: no copy of THIS package's manifest exists
    // at any depth, so the walk reaches the root and the spawn uses the bare name. Addressed by the
    // package's own manifest suffix, so a read of any other file is still unstaged.
    setupNotInstalledAnywhere: ({ binName }): void => {
      const suffix = `/${dungeonmasterBinStatics.layout.modulesDir}/${dungeonmasterBinStatics.packages[binName]}/${dungeonmasterBinStatics.layout.manifest}`;
      manifestProxy.throwsMatchingPath({
        path: (value: unknown) => typeof value === 'string' && value.endsWith(suffix),
        error: FsErrorStub({ code: 'ENOENT', path: suffix }),
      });
    },
  };
};
