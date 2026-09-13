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

import { osUserHomedirAdapter } from '../../../adapters/os/user-homedir/os-user-homedir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsClaudeProjectsRootFindBroker = (): AbsoluteFilePath => {
  const joined = pathJoinAdapter({
    paths: [
      osUserHomedirAdapter(),
      locationsStatics.userHome.claude.dir,
      locationsStatics.userHome.claude.projectsDir,
    ],
  });

  return absoluteFilePathContract.parse(joined);
};
