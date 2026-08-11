import { AbsoluteFilePathStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';

import { questCwdResolutionContract } from './quest-cwd-resolution-contract';
import { QuestCwdResolutionStub } from './quest-cwd-resolution.stub';

describe('questCwdResolutionContract', () => {
  describe('worktree variant', () => {
    it('VALID: {kind: worktree, cwd} => parses successfully', () => {
      const cwd = RepoRootCwdStub({ value: '/repo/worktrees/quest-1' });

      const result = questCwdResolutionContract.parse({ kind: 'worktree', cwd });

      expect(result).toStrictEqual({ kind: 'worktree', cwd });
    });

    it('INVALID: {kind: worktree, missing cwd} => throws Required', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'worktree' })).toThrow(/Required/u);
    });

    it('INVALID: {kind: worktree, cwd: relative path} => throws absolute-path error', () => {
      expect(() =>
        questCwdResolutionContract.parse({ kind: 'worktree', cwd: 'relative/path' }),
      ).toThrow(/Path must be absolute/u);
    });
  });

  describe('repo-root variant', () => {
    it('VALID: {kind: repo-root, cwd} => parses successfully', () => {
      const cwd = RepoRootCwdStub({ value: '/repo/root' });

      const result = questCwdResolutionContract.parse({ kind: 'repo-root', cwd });

      expect(result).toStrictEqual({ kind: 'repo-root', cwd });
    });

    it('INVALID: {kind: repo-root, missing cwd} => throws Required', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'repo-root' })).toThrow(/Required/u);
    });
  });

  describe('missing-worktree variant', () => {
    it('VALID: {kind: missing-worktree, worktreePath} => parses successfully', () => {
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-1' });

      const result = questCwdResolutionContract.parse({
        kind: 'missing-worktree',
        worktreePath,
      });

      expect(result).toStrictEqual({ kind: 'missing-worktree', worktreePath });
    });

    it('INVALID: {kind: missing-worktree, missing worktreePath} => throws Required', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'missing-worktree' })).toThrow(
        /Required/u,
      );
    });

    it('EDGE: {kind: missing-worktree, cwd also present} => strips the extraneous cwd field', () => {
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-1' });

      const result = questCwdResolutionContract.parse({
        kind: 'missing-worktree',
        worktreePath,
        cwd: '/repo/root',
      });

      expect(result).toStrictEqual({ kind: 'missing-worktree', worktreePath });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {kind: unknown} => throws discriminator error', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'unknown' })).toThrow(
        /Invalid discriminator value/u,
      );
    });
  });

  describe('QuestCwdResolutionStub', () => {
    it('VALID: {no overrides} => defaults to the repo-root variant', () => {
      const result = questCwdResolutionContract.parse(QuestCwdResolutionStub());

      expect(result).toStrictEqual({
        kind: 'repo-root',
        cwd: RepoRootCwdStub({ value: '/test/repo/root' }),
      });
    });

    it('VALID: {kind: worktree override} => builds the worktree variant', () => {
      const cwd = RepoRootCwdStub({ value: '/repo/worktrees/quest-1' });

      const result = questCwdResolutionContract.parse(
        QuestCwdResolutionStub({ kind: 'worktree', cwd }),
      );

      expect(result).toStrictEqual({ kind: 'worktree', cwd });
    });
  });
});
