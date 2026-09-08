import { gitStashBlockStatics } from './git-stash-block-statics';

describe('gitStashBlockStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gitStashBlockStatics).toStrictEqual({
      blockMessage: [
        'BLOCKED: `git stash` moves the ENTIRE working tree, not just your files. Other sessions and sub-agents edit this same checkout while you work, so a stash/pop round-trip can swallow or clobber changes you never looked at.',
        'Reading an old version of a file: `git show <rev>:<path>` — it writes nothing to the tree.',
        'Running against a different revision: `mcp__dungeonmaster__create-worktree({ name })`.',
        'Discarding your own edit: `git checkout -- <path>`, naming every path you mean.',
        '`git stash list` and `git stash show` are NOT blocked — inspect an existing stash freely.',
      ].join('\n'),
      readOnlySubcommands: ['list', 'show'],
    });
  });
});
