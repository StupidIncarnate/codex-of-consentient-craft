/**
 * PURPOSE: Resolves the Claude CLI sessions directory for a given guild path — encodes guildPath into the projects-dir slug
 *
 * USAGE:
 * locationsClaudeSessionsDirFindBroker({ guildPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }) });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project'
 */

import { osUserHomedirAdapter } from '../../../adapters/os/user-homedir/os-user-homedir-adapter';
import { claudePathSlugEncoderTransformer } from '../../../transformers/claude-path-slug-encoder/claude-path-slug-encoder-transformer';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsClaudeSessionsDirFindBroker = ({
  guildPath,
}: {
  guildPath: AbsoluteFilePath;
}): AbsoluteFilePath =>
  claudePathSlugEncoderTransformer({
    homeDir: osUserHomedirAdapter(),
    projectPath: guildPath,
  });
