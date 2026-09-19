/**
 * PURPOSE: Reads the current git branch name using `git rev-parse --abbrev-ref HEAD` — returns the
 * branch name as `ContentText`, or `null` if the repository is in a detached HEAD state, not inside
 * a git worktree, or if git execution fails. Reach for this whenever recording an instance's git
 * provenance at reservation time.
 *
 * USAGE:
 * gitBranchReadAdapter();
 * // Returns 'main' as ContentText, or null
 */

import { execSync } from 'child_process';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const gitBranchReadAdapter = (): ContentText | null => {
  try {
    const rawOutput = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (rawOutput.length === 0 || rawOutput === 'HEAD') {
      return null;
    }

    return contentTextContract.parse(rawOutput);
  } catch {
    return null;
  }
};
