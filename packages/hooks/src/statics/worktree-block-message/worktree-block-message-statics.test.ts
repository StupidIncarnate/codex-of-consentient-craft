import { worktreeBlockMessageStatics } from './worktree-block-message-statics';

describe('worktreeBlockMessageStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(worktreeBlockMessageStatics).toStrictEqual({
      blockMessage:
        'Worktrees are created with `mcp__dungeonmaster__create-worktree({ name })`. It puts them under `worktrees/`.',
    });
  });
});
