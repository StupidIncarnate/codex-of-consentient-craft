import { agentGitPermissionsStatics } from './agent-git-permissions-statics';

const HANDOFF_COMMIT_ENTRIES = new Set(['Bash(git add:*)', 'Bash(git commit:*)']);

// The two commands the warpgate merge role needs: it merges base into the quest branch inside
// the quest's worktree, then checks the repo root out onto base and merges the quest branch in.
const MERGE_ROLE_ENTRIES = new Set(['Bash(git checkout:*)', 'Bash(git merge:*)']);

// The two read-only ref-resolution commands: `rev-parse` for a reviewer pass locating where an
// earlier pass's own work starts (e.g. `@{upstream}`), and `merge-base` for warpgate's ancestor
// check. Neither creates, deletes or moves a ref.
const READ_ONLY_REF_ENTRIES = new Set(['Bash(git rev-parse:*)', 'Bash(git merge-base:*)']);

describe('agentGitPermissionsStatics', () => {
  describe('allow', () => {
    it('VALID: {agentGitPermissionsStatics} => exposes exactly the read + handoff-commit + merge-role + pass-push git entries', () => {
      expect(agentGitPermissionsStatics).toStrictEqual({
        allow: [
          'Bash(git status:*)',
          'Bash(git log:*)',
          'Bash(git diff:*)',
          'Bash(git show:*)',
          'Bash(git add:*)',
          'Bash(git rm:*)',
          'Bash(git mv:*)',
          'Bash(git commit:*)',
          'Bash(git checkout:*)',
          'Bash(git merge:*)',
          'Bash(git push:*)',
          'Bash(git rev-parse:*)',
          'Bash(git merge-base:*)',
        ],
      });
    });

    it('VALID: {allow} => grants the read-only ref resolution a reviewer pass and warpgate need', () => {
      const { allow } = agentGitPermissionsStatics;

      expect(allow.filter((entry) => READ_ONLY_REF_ENTRIES.has(entry))).toStrictEqual([
        'Bash(git rev-parse:*)',
        'Bash(git merge-base:*)',
      ]);
    });

    it('VALID: {allow} => grants the two commands the relay handoff commit needs', () => {
      const { allow } = agentGitPermissionsStatics;
      const handoff = allow.filter((entry) => HANDOFF_COMMIT_ENTRIES.has(entry));

      expect(handoff).toStrictEqual(['Bash(git add:*)', 'Bash(git commit:*)']);
    });

    it('VALID: {allow} => grants the two commands the warpgate merge needs', () => {
      const { allow } = agentGitPermissionsStatics;
      const mergeRole = allow.filter((entry) => MERGE_ROLE_ENTRIES.has(entry));

      expect(mergeRole).toStrictEqual(['Bash(git checkout:*)', 'Bash(git merge:*)']);
    });

    // A `<role>-reviewer` pushes once at the end of every pass, as the last thing it does,
    // and that push is the only way the pass leaves the worktree. Denying it makes the reviewer's
    // own mandated step come back `This command requires approval`, which its `[WALL]` operating
    // rule defines as an environment wall — so the pass returns `NEXT: wall` and the quest halts.
    it("VALID: {allow} => grants the push a pass's reviewer makes to publish it", () => {
      const { allow } = agentGitPermissionsStatics;

      expect(allow.filter((entry) => entry === 'Bash(git push:*)')).toStrictEqual([
        'Bash(git push:*)',
      ]);
    });

    it('VALID: {allow} => withholds every history-rewriting command', () => {
      const { allow } = agentGitPermissionsStatics;
      const rewriting = allow.filter((entry) => /git (stash|reset|rebase)/u.test(entry));

      expect(rewriting).toStrictEqual([]);
    });
  });
});
