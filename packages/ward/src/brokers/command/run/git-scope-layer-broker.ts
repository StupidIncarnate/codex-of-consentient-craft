/**
 * PURPOSE: Layer of commandRunBroker — turns whichever git scope flags the run carries into the
 * plain file list every check runner already understands, so nothing downstream has to know that
 * `--committed` and `--uncommitted` exist. Non-source paths are dropped here because ESLint reports
 * a "file ignored" error for a .md or .json handed to it explicitly.
 *
 * BOTH FLAGS AT ONCE IS THE WHOLE-BRANCH RUN, and it is a union rather than a choice: the two file
 * sets are disjoint by construction — one ends at HEAD, the other starts there — so neither can
 * shadow the other. A reviewer that wants everything its pass produced, committed or not, passes
 * both.
 *
 * USAGE:
 * const resolved = await gitScopeLayerBroker({ config: WardConfigStub({ uncommitted: true }), rootPath });
 * // Returns the same config with passthrough set to the working tree's source files
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { isSourceFileGuard } from '../../../guards/is-source-file/is-source-file-guard';
import { gitDiffCommittedBroker } from '../../git/diff-committed/git-diff-committed-broker';
import { gitDiffUncommittedBroker } from '../../git/diff-uncommitted/git-diff-uncommitted-broker';

export const gitScopeLayerBroker = async ({
  config,
  rootPath,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
}): Promise<WardConfig> => {
  if (config.committed !== true && config.uncommitted !== true) {
    return config;
  }

  const committedFiles =
    config.committed === true ? await gitDiffCommittedBroker({ cwd: rootPath }) : [];
  const uncommittedFiles =
    config.uncommitted === true ? await gitDiffUncommittedBroker({ cwd: rootPath }) : [];

  // A file committed on this branch AND edited again since sits in both readings. De-duplicate on
  // first appearance — a check runner handed the same path twice reports it twice.
  const seen = new Set<GitRelativePath>();
  const files = [...committedFiles, ...uncommittedFiles].filter((file) => {
    if (seen.has(file)) {
      return false;
    }
    seen.add(file);
    return true;
  });

  const sourceFiles = files.filter((file) => isSourceFileGuard({ filePath: String(file) }));

  if (sourceFiles.length === 0) {
    return config;
  }

  return {
    ...config,
    passthrough: sourceFiles.map(String) as WardConfig['passthrough'],
  };
};
