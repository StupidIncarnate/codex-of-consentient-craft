import { worktreeVerifyLinksStatics } from './worktree-verify-links-statics';

describe('worktreeVerifyLinksStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(worktreeVerifyLinksStatics).toStrictEqual({
      maxReportedLinks: 10,
    });
  });
});
