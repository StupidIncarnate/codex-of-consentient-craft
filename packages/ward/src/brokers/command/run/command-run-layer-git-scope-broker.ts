/**
 * PURPOSE: Layer of commandRunBroker — turns whichever git scope flag the run carries into the plain
 * file list every check runner already understands, so nothing downstream has to know that `--staged`
 * and `--changed` exist. Non-source paths are dropped here because ESLint reports a "file ignored"
 * error for a .md or .json handed to it explicitly.
 *
 * USAGE:
 * const resolved = await commandRunLayerGitScopeBroker({ config: WardConfigStub({ staged: true }), rootPath });
 * // Returns the same config with passthrough set to the unpushed source files
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import { isSourceFileGuard } from '../../../guards/is-source-file/is-source-file-guard';
import { gitDiffFilesBroker } from '../../git/diff-files/git-diff-files-broker';
import { gitDiffUnpushedBroker } from '../../git/diff-unpushed/git-diff-unpushed-broker';

export const commandRunLayerGitScopeBroker = async ({
  config,
  rootPath,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
}): Promise<WardConfig> => {
  if (config.staged !== true && config.changed !== true) {
    return config;
  }

  const files =
    config.staged === true
      ? await gitDiffUnpushedBroker({ cwd: rootPath })
      : await gitDiffFilesBroker({ cwd: rootPath });

  const sourceFiles = files.filter((file) => isSourceFileGuard({ filePath: String(file) }));

  if (sourceFiles.length === 0) {
    return config;
  }

  return {
    ...config,
    passthrough: sourceFiles.map(String) as WardConfig['passthrough'],
  };
};
