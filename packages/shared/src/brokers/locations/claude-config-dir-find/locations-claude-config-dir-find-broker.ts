/**
 * PURPOSE: Resolves the directory that holds Claude CLI's own config and transcripts — the
 * folder CLAUDE_CONFIG_DIR replaces AS A WHOLE when set, not a suffix appended onto some other
 * root. Reach for this over homedir() plus a literal '.claude' join wherever a reader needs the
 * Claude folder itself, so CLAUDE_CONFIG_DIR can relocate it.
 *
 * USAGE:
 * locationsClaudeConfigDirFindBroker();
 * // Returns AbsoluteFilePath '/home/user/.claude', or CLAUDE_CONFIG_DIR verbatim when set
 */

import { homedir } from '#gateway/node/os';
import { isAbsolute, join } from '#gateway/node/path';
import { getEnv } from '#gateway/node/process';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsClaudeConfigDirFindBroker = (): string => {
  const envValue = getEnv('CLAUDE_CONFIG_DIR');

  if (envValue !== undefined && envValue !== '') {
    if (!isAbsolute(envValue)) {
      throw new Error(`CLAUDE_CONFIG_DIR must be an absolute path, got "${envValue}"`);
    }

    return envValue;
  }

  const joined = join(homedir(), locationsStatics.userHome.claude.dir);

  return joined;
};
