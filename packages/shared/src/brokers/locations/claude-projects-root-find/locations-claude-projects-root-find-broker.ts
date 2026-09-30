/**
 * PURPOSE: Resolves the root directory holding EVERY Claude CLI transcript on this machine. Reach
 *   for this over locationsClaudeSessionsDirFindBroker, which encodes one project path into one
 *   slug: quota is an ACCOUNT-wide budget, so a measurement scoped to a single guild misses the
 *   user's own interactive sessions and every other repo they worked in — which is most of the
 *   spend the guardrail exists to see.
 *
 * USAGE:
 * locationsClaudeProjectsRootFindBroker();
 * // Returns AbsoluteFilePath '/home/user/.claude/projects'
 */

import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsClaudeProjectsRootFindBroker = (): string => {
  const joined = join(
    homedir(),
    locationsStatics.userHome.claude.dir,
    locationsStatics.userHome.claude.projectsDir,
  );

  return joined;
};
