/**
 * PURPOSE: Names the path ESLint refused when an explicitly-passed folder or glob holds no lintable
 * file. Reach for this over isEslintIgnoredResultGuard when ESLint CRASHED (exit 2, no JSON) rather
 * than answering with a "File ignored" entry: a folder of JSON fixtures aborts the whole run, and the
 * pattern it names is the one to drop before running again.
 *
 * USAGE:
 * eslintIgnoredPatternExtractTransformer({ output: 'You are linting "a/b", but all of the files matching the glob pattern "a/b" are ignored.' });
 * // Returns GitRelativePath 'a/b'; undefined for any other output
 *
 * THE MATCH IS THE WHOLE SENTENCE, quoted pattern twice, so an ordinary lint failure that merely
 * quotes a path can never read as this crash.
 */

import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../contracts/git-relative-path/git-relative-path-contract';

const IGNORED_SENTENCE =
  /You are linting "(?<linted>[^"]+)", but all of the files matching the glob pattern "(?<glob>[^"]+)" are ignored\./u;

export const eslintIgnoredPatternExtractTransformer = ({
  output,
}: {
  output: string;
}): GitRelativePath | undefined => {
  const groups = IGNORED_SENTENCE.exec(output)?.groups;

  if (groups?.linted === undefined || groups.linted !== groups.glob) {
    return undefined;
  }

  return gitRelativePathContract.parse(groups.linted);
};
