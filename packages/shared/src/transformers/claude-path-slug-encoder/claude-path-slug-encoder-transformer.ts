/**
 * PURPOSE: Builds the absolute path to the Claude CLI sessions directory for a given project path by encoding the project path slug
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

const PATH_SEPARATOR_PATTERN = /\//gu;

export const claudePathSlugEncoderTransformer = ({
  homeDir,
  projectPath,
}: {
  homeDir: AbsoluteFilePath;
  projectPath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const encoded = projectPath.replace(PATH_SEPARATOR_PATTERN, '-');
  return absoluteFilePathContract.parse(
    `${homeDir}/${locationsStatics.userHome.claude.dir}/${locationsStatics.userHome.claude.projectsDir}/${encoded}`,
  );
};
