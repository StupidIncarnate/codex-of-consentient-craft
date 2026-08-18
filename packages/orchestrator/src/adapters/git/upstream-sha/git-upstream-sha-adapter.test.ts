import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitUpstreamShaAdapter } from './git-upstream-sha-adapter';
import { gitUpstreamShaAdapterProxy } from './git-upstream-sha-adapter.proxy';

describe('gitUpstreamShaAdapter', () => {
  describe('successful read', () => {
    it('VALID: {git rev-parse @{upstream} succeeds} => returns trimmed sha', async () => {
      const proxy = gitUpstreamShaAdapterProxy();
      proxy.setupSuccess({ sha: 'b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2' });

      const result = await gitUpstreamShaAdapter({
        cwd: AbsoluteFilePathStub({ value: '/worktree' }),
      });

      expect(result).toBe('b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2');
    });

    // The exact ref matters: `@{upstream}` is what a plain `git push` moves, so `@{upstream}..HEAD`
    // is precisely "committed here, not yet published" — the round in flight.
    it('VALID: {cwd} => spawns `git rev-parse @{upstream}`', async () => {
      const proxy = gitUpstreamShaAdapterProxy();
      proxy.setupSuccess({ sha: 'b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2' });

      await gitUpstreamShaAdapter({ cwd: AbsoluteFilePathStub({ value: '/worktree' }) });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['rev-parse', '@{upstream}']);
    });
  });

  describe('failure cases', () => {
    // Not an error state. A branch tracking nothing is what a quest carved before riftcarver
    // started pushing looks like, and the caller falls back to the quest's pinned baseRef.
    it('ERROR: {branch tracks no upstream} => returns null', async () => {
      const proxy = gitUpstreamShaAdapterProxy();
      proxy.setupNoUpstream();

      const result = await gitUpstreamShaAdapter({
        cwd: AbsoluteFilePathStub({ value: '/worktree' }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {exit code 0 but empty stdout} => returns null', async () => {
      const proxy = gitUpstreamShaAdapterProxy();
      proxy.setupSuccess({ sha: '' });

      const result = await gitUpstreamShaAdapter({
        cwd: AbsoluteFilePathStub({ value: '/worktree' }),
      });

      expect(result).toBe(null);
    });
  });
});
