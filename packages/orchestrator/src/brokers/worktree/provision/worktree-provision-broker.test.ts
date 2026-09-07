import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WorktreePrepareError } from '../../../errors/worktree-prepare/worktree-prepare-error';
import { worktreeProvisionBroker } from './worktree-provision-broker';
import { worktreeProvisionBrokerProxy } from './worktree-provision-broker.proxy';

const REPO_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const WORKTREE_PATH = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

describe('worktreeProvisionBroker', () => {
  describe('a tree that provisions cleanly', () => {
    it('VALID: {bare worktree} => reports ok', async () => {
      const proxy = worktreeProvisionBrokerProxy();
      proxy.setupBareWorktree({ repoRoot: REPO_ROOT, worktreePath: WORKTREE_PATH });

      const result = await worktreeProvisionBroker({
        repoRoot: REPO_ROOT,
        worktreePath: WORKTREE_PATH,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ ok: true });
    });

    it('VALID: {bare worktree} => hardlinks the source entries into the worktree', async () => {
      const proxy = worktreeProvisionBrokerProxy();
      proxy.setupBareWorktree({ repoRoot: REPO_ROOT, worktreePath: WORKTREE_PATH });

      await worktreeProvisionBroker({
        repoRoot: REPO_ROOT,
        worktreePath: WORKTREE_PATH,
        onLine: () => undefined,
      });

      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/zod', '/repo/worktrees/probe/node_modules'],
      ]);
    });
  });

  describe('the seed step runs', () => {
    it('ERROR: {a source package with no compiled output} => names seed-dist, which halts the quest', async () => {
      const proxy = worktreeProvisionBrokerProxy();
      proxy.setupBareWorktree({ repoRoot: REPO_ROOT, worktreePath: WORKTREE_PATH });
      proxy.setupUnbuiltSourcePackage({
        repoRoot: REPO_ROOT,
        worktreePath: WORKTREE_PATH,
        packageName: 'shared',
      });

      const result = await worktreeProvisionBroker({
        repoRoot: REPO_ROOT,
        worktreePath: WORKTREE_PATH,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        ok: false,
        failedStep: 'seed-dist',
        error: new WorktreePrepareError({
          step: 'seed-dist',
          detail:
            "/repo/worktrees/probe: the main checkout at /repo has no compiled output for 1 package(s) — run the repo's build before carving a worktree: shared",
        }),
      });
    });
  });

  describe('the audit runs AFTER the mirror, so it sees the links the mirror wrote', () => {
    it('ERROR: {a node_modules link resolving outside the worktree} => names verify-links, which halts the quest', async () => {
      const proxy = worktreeProvisionBrokerProxy();
      proxy.setupBareWorktree({ repoRoot: REPO_ROOT, worktreePath: WORKTREE_PATH });
      proxy.setupMirroredLinkEscapingTheWorktree({
        worktreePath: WORKTREE_PATH,
        linkName: 'zod',
        absoluteTarget: '/repo/node_modules/zod',
      });

      const result = await worktreeProvisionBroker({
        repoRoot: REPO_ROOT,
        worktreePath: WORKTREE_PATH,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        ok: false,
        failedStep: 'verify-links',
        error: new WorktreePrepareError({
          step: 'verify-links',
          detail:
            '/repo/worktrees/probe: 1 of 1 node_modules symlink(s) do not resolve inside the worktree, so every command run here would grade the main checkout: /repo/worktrees/probe/node_modules/zod -> /repo/node_modules/zod (lands at /repo/node_modules/zod)',
        }),
      });
    });
  });
});
