/**
 * PURPOSE: Resolves the Claude CLI sessions directory for a given guild path — encodes guildPath into the projects-dir slug
 *
 * USAGE:
 * locationsClaudeSessionsDirFindBroker({ guildPath: '/home/user/my-project' });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project'
 */

import { homedir } from '#gateway/node/os';
import { claudePathSlugEncoderTransformer } from '../../../transformers/claude-path-slug-encoder/claude-path-slug-encoder-transformer';
import type { Guild } from '../../../contracts/guild/guild-contract';

export const locationsClaudeSessionsDirFindBroker = ({
  guildPath,
}: {
  guildPath: Guild['path'];
}): string =>
  claudePathSlugEncoderTransformer({
    homeDir: homedir(),
    projectPath: guildPath,
  });
