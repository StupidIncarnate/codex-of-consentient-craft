import { agentGitPermissionsStatics } from './agent-git-permissions-statics';

const HANDOFF_COMMIT_ENTRIES = new Set(['Bash(git add:*)', 'Bash(git commit:*)']);

describe('agentGitPermissionsStatics', () => {
  describe('allow', () => {
    it('VALID: {agentGitPermissionsStatics} => exposes exactly the read + handoff-commit git entries', () => {
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
        ],
      });
    });

    it('VALID: {allow} => grants the two commands the relay handoff commit needs', () => {
      const { allow } = agentGitPermissionsStatics;
      const handoff = allow.filter((entry) => HANDOFF_COMMIT_ENTRIES.has(entry));

      expect(handoff).toStrictEqual(['Bash(git add:*)', 'Bash(git commit:*)']);
    });

    it('VALID: {allow} => withholds history-rewriting and remote-publishing commands', () => {
      const { allow } = agentGitPermissionsStatics;
      const rewriting = allow.filter((entry) =>
        /git (stash|reset|checkout|rebase|push)/u.test(entry),
      );

      expect(rewriting).toStrictEqual([]);
    });
  });
});
