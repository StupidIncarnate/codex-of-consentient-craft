/**
 * PURPOSE: Builds the absolute path to the Claude CLI sessions directory for a given project path,
 * mirroring the real Claude CLI's own project-directory naming so this repo's lookups land on the
 * directory the CLI actually created. The CLI turns every character that is not an ASCII letter or
 * digit into a literal `-`, one-for-one — confirmed by reading its bundled source
 * (`e.replace(/[^a-zA-Z0-9]/g,"-")`) and by cross-checking real `~/.claude/projects/*` directory
 * names against the `cwd` recorded inside their own session JSONL (e.g. a cwd ending
 * `.claude/worktrees/x` produced a directory ending `--claude-worktrees-x`: adjacent `/` and `.`
 * each become their own hyphen, so runs of separators do not collapse). The CLI additionally caps
 * the encoded name at 200 characters with a hash-suffixed truncation beyond that; this transformer
 * does not reproduce that cap.
 *
 * USAGE:
 * claudePathSlugEncoderTransformer({
 *   homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
 *   projectPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project'
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import { locationsStatics } from '../../statics/locations/locations-statics';

const NON_ALPHANUMERIC_PATTERN = /[^a-zA-Z0-9]/gu;

export const claudePathSlugEncoderTransformer = ({
  homeDir,
  projectPath,
}: {
  homeDir: AbsoluteFilePath;
  projectPath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const encoded = projectPath.replace(NON_ALPHANUMERIC_PATTERN, '-');
  return absoluteFilePathContract.parse(
    `${homeDir}/${locationsStatics.userHome.claude.dir}/${locationsStatics.userHome.claude.projectsDir}/${encoded}`,
  );
};
