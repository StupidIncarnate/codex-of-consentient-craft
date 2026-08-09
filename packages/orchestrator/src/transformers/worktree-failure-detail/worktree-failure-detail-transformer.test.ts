import { AbsoluteFilePathStub, ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { worktreeFailureDetailTransformer } from './worktree-failure-detail-transformer';

describe('worktreeFailureDetailTransformer', () => {
  it('VALID: {no cleanupOutput} => returns worktreePath and cause joined by a colon', () => {
    const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

    const result = worktreeFailureDetailTransformer({
      worktreePath,
      cause: 'npm run build exited with code 1',
    });

    expect(result).toBe('/repo/worktrees/quest-slug-a1b2c3d4: npm run build exited with code 1');
  });

  it('VALID: {non-empty cleanupOutput} => appends the cleanup failure detail', () => {
    const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
    const cleanupOutput = ErrorMessageStub({ value: 'rm -rf failed: EBUSY' });

    const result = worktreeFailureDetailTransformer({
      worktreePath,
      cause: 'npm run build exited with code 1',
      cleanupOutput,
    });

    expect(result).toBe(
      '/repo/worktrees/quest-slug-a1b2c3d4: npm run build exited with code 1 (worktree cleanup also failed: rm -rf failed: EBUSY)',
    );
  });

  it('EMPTY: {cleanupOutput: ""} => omits the cleanup suffix', () => {
    const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
    const cleanupOutput = ErrorMessageStub({ value: '' });

    const result = worktreeFailureDetailTransformer({
      worktreePath,
      cause: 'npm run build exited with code 1',
      cleanupOutput,
    });

    expect(result).toBe('/repo/worktrees/quest-slug-a1b2c3d4: npm run build exited with code 1');
  });
});
