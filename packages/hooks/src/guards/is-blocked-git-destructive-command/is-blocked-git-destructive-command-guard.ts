/**
 * PURPOSE: Checks whether a bash command runs a git verb that discards or rewrites work on the
 * shared checkout. Reach for this over `isBlockedQualityCommandGuard`, which catches a session
 * running a test tool directly; this one catches a session taking work away from its siblings.
 *
 * USAGE:
 * isBlockedGitDestructiveCommandGuard({ command: 'git checkout -- src/index.ts' });
 * // Returns true because the working-tree version of that path is thrown away
 * isBlockedGitDestructiveCommandGuard({ command: 'git checkout main' });
 * // Returns false because switching branches takes nothing
 */

// Every git call in the command line, not just the first: `git stash list && git stash pop` must
// block on the pop. The leading class admits the separators a shell allows before a fresh command,
// and `rest` stops at the next one so each call is judged on its own arguments.
//
// The flag repetition spells out the global flags that take a SEPARATE value word (`git -C /repo
// reset`) before the catch-all valueless branch. A blanket "flag plus optional word" would swallow
// the value and read the next word as the verb. The verb has to be the first non-flag word after
// `git`, which is what keeps `git log --grep stash` out: `log` is not a flag, so the alternation
// never reaches `stash`.
const GIT_COMMAND_PATTERN =
  /(?:^|[&;|(\n])\s*git\s+(?:(?:-[Cc]|--(?:git-dir|work-tree|exec-path|namespace))\s+\S+\s+|-{1,2}\S+\s+)*(?<verb>stash|reset|clean|rebase|checkout|restore)(?<rest>[^&;|(\n]*)/gu;

// Each entry answers one question: given this verb, does the REST of that call make it destructive?
// `checkout` is inverted from the others because it is mostly legitimate — the merge role switches
// branches with it — so only the forms that overwrite a path are named.
const BLOCKED_REST_RULES = [
  { verb: 'stash', blockedRest: /^(?!\s+(?:list|show)\b)/u },
  { verb: 'reset', blockedRest: /\S/u },
  { verb: 'clean', blockedRest: /^(?!.*\s(?:-n|--dry-run)\b)/u },
  { verb: 'rebase', blockedRest: /^(?!.*\s(?:--abort|--quit)\b)/u },
  { verb: 'checkout', blockedRest: /\s--(?:\s|$)|^\s*\.\s*$/u },
  { verb: 'restore', blockedRest: /^(?!.*\s--staged\b)|\s--worktree\b/u },
] as const;

export const isBlockedGitDestructiveCommandGuard = ({ command }: { command?: string }): boolean => {
  if (command === undefined) {
    return false;
  }

  return Array.from(command.matchAll(GIT_COMMAND_PATTERN)).some((match) => {
    // Read both groups before the comparison rather than inside it. Comparing `match.groups?.verb`
    // narrows `match.groups` to non-nullish for the rest of an `&&`, and the second read is then a
    // lint error for a chain the compiler still demands.
    const verb = match.groups?.verb ?? '';
    const rest = match.groups?.rest ?? '';

    return BLOCKED_REST_RULES.some((rule) => rule.verb === verb && rule.blockedRest.test(rest));
  });
};
