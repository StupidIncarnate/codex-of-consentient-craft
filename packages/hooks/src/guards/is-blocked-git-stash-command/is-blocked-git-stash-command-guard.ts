/**
 * PURPOSE: Checks if a bash command runs a `git stash` that moves the working tree, which is refused
 * because the tree is shared with every other session and sub-agent in this checkout
 *
 * USAGE:
 * isBlockedGitStashCommandGuard({ command: 'git stash pop' });
 * // Returns true because pop rewrites a working tree other agents are editing
 * isBlockedGitStashCommandGuard({ command: 'git stash list' });
 * // Returns false because list writes nothing
 */
import { gitStashBlockStatics } from '../../statics/git-stash-block/git-stash-block-statics';

// Every stash in the command line, not just the first: `git stash list && git stash pop` must block on
// the pop. The leading class admits the separators a shell allows before a fresh command.
//
// The flag repetition spells out the global flags that take a SEPARATE value word (`git -C /repo
// stash`) before the catch-all valueless branch. A blanket "flag plus optional word" would swallow the
// value and then match the subcommand as one, so `git log --grep stash` would read as a stash.
const GIT_STASH_PATTERN =
  /(?:^|[&;|(])\s*git\s+(?:(?:-[Cc]|--(?:git-dir|work-tree|exec-path|namespace))\s+\S+\s+|-{1,2}\S+\s+)*stash(?:\s+(?<subcommand>[a-z-]+))?/gu;

export const isBlockedGitStashCommandGuard = ({ command }: { command?: string }): boolean => {
  if (command === undefined) {
    return false;
  }

  const stashes = Array.from(command.matchAll(GIT_STASH_PATTERN));

  return stashes.some(
    (match) =>
      !gitStashBlockStatics.readOnlySubcommands.some(
        (allowed) => allowed === match.groups?.subcommand,
      ),
  );
};
