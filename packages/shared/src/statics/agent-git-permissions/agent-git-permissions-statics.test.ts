import { agentGitPermissionsStatics } from './agent-git-permissions-statics';

const HANDOFF_COMMIT_ENTRIES = new Set(['Bash(git add:*)', 'Bash(git commit:*)']);

// The two commands the warpgate merge role needs: it merges base into the quest branch inside
// the quest's worktree, then checks the repo root out onto base and merges the quest branch in.
const MERGE_ROLE_ENTRIES = new Set(['Bash(git checkout:*)', 'Bash(git merge:*)']);

describe('agentGitPermissionsStatics', () => {
  describe('allow', () => {
    it('VALID: {agentGitPermissionsStatics} => exposes exactly the read + handoff-commit + merge-role + round-push git entries', () => {
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
        ],
      });
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

    // An operator's gate 9 pushes once per round, and its reviewer measures that round as
    // `@{upstream}..HEAD`. Denying it makes the prompt's own mandated step come back
    // `This command requires approval`, which Operating Rule 5 defines as an environment wall.
    it('VALID: {allow} => grants the round push an operator gate 9 makes', () => {
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
