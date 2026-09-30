import { questCwdResolutionContract } from './quest-cwd-resolution-contract';
import { QuestCwdResolutionStub } from './quest-cwd-resolution.stub';

describe('questCwdResolutionContract', () => {
  describe('session variant', () => {
    it('VALID: {kind: session, cwd} => parses successfully', () => {
      const cwd = '/repo';

      const result = questCwdResolutionContract.parse({ kind: 'session', cwd });

      expect(result).toStrictEqual({ kind: 'session', cwd });
    });

    it('INVALID: {kind: session, missing cwd} => throws Required', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'session' })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {kind: session, cwd: relative path} => throws absolute-path error', () => {
      expect(() =>
        questCwdResolutionContract.parse({ kind: 'session', cwd: 'relative/path' }),
      ).toThrow(/Path must be absolute/u);
    });
  });

  describe('worktree variant', () => {
    it('VALID: {kind: worktree, cwd} => parses successfully', () => {
      const cwd = '/repo/worktrees/quest-1';

      const result = questCwdResolutionContract.parse({ kind: 'worktree', cwd });

      expect(result).toStrictEqual({ kind: 'worktree', cwd });
    });

    it('INVALID: {kind: worktree, missing cwd} => throws Required', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'worktree' })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {kind: worktree, cwd: relative path} => throws absolute-path error', () => {
      expect(() =>
        questCwdResolutionContract.parse({ kind: 'worktree', cwd: 'relative/path' }),
      ).toThrow(/Path must be absolute/u);
    });
  });

  describe('repo-root variant', () => {
    it('VALID: {kind: repo-root, cwd} => parses successfully', () => {
      const cwd = '/repo/root';

      const result = questCwdResolutionContract.parse({ kind: 'repo-root', cwd });

      expect(result).toStrictEqual({ kind: 'repo-root', cwd });
    });

    it('INVALID: {kind: repo-root, missing cwd} => throws Required', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'repo-root' })).toThrow(
        /received undefined/u,
      );
    });
  });

  describe('missing-worktree variant', () => {
    it('VALID: {kind: missing-worktree, worktreePath} => parses successfully', () => {
      const worktreePath = '/repo/worktrees/quest-1';

      const result = questCwdResolutionContract.parse({
        kind: 'missing-worktree',
        worktreePath,
      });

      expect(result).toStrictEqual({ kind: 'missing-worktree', worktreePath });
    });

    it('INVALID: {kind: missing-worktree, missing worktreePath} => throws Required', () => {
      expect(() => questCwdResolutionContract.parse({ kind: 'missing-worktree' })).toThrow(
        /received undefined/u,
      );
    });

    it('EDGE: {kind: missing-worktree, cwd also present} => strips the extraneous cwd field', () => {
      const worktreePath = '/repo/worktrees/quest-1';

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
        cwd: '/test/repo/root',
      });
    });

    it('VALID: {kind: worktree override} => builds the worktree variant', () => {
      const cwd = '/repo/worktrees/quest-1';

      const result = questCwdResolutionContract.parse(
        QuestCwdResolutionStub({ kind: 'worktree', cwd }),
      );

      expect(result).toStrictEqual({ kind: 'worktree', cwd });
    });
  });
});
