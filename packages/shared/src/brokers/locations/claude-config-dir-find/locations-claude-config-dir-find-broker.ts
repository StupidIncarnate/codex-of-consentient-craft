/**
 * PURPOSE: Resolves the directory that holds Claude CLI's own config and transcripts — the
 * folder CLAUDE_CONFIG_DIR replaces AS A WHOLE when set, not a suffix appended onto some other
 * root. Reach for this over osUserHomedirAdapter() plus a literal '.claude' join wherever a
 * reader needs the Claude folder itself, so CLAUDE_CONFIG_DIR can relocate it.
 *
 * USAGE:
 * locationsClaudeConfigDirFindBroker();
 * // Returns AbsoluteFilePath '/home/user/.claude', or CLAUDE_CONFIG_DIR verbatim when set
 */

import { osUserHomedirAdapter } from '../../../adapters/os/user-homedir/os-user-homedir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsClaudeConfigDirFindBroker = (): AbsoluteFilePath => {
  const envValue = process.env.CLAUDE_CONFIG_DIR;

  if (envValue !== undefined && envValue !== '') {
    const parsed = absoluteFilePathContract.safeParse(envValue);

    if (!parsed.success) {
      throw new Error(`CLAUDE_CONFIG_DIR must be an absolute path, got "${envValue}"`);
    }

    return parsed.data;
  }

  const joined = pathJoinAdapter({
    paths: [osUserHomedirAdapter(), locationsStatics.userHome.claude.dir],
  });

  return absoluteFilePathContract.parse(joined);
};
