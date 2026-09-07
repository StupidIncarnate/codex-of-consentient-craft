import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { worktreeSeedDistBroker } from './worktree-seed-dist-broker';
import { worktreeSeedDistBrokerProxy } from './worktree-seed-dist-broker.proxy';

describe('worktreeSeedDistBroker', () => {
  describe('seeding a fresh worktree', () => {
    // `cp -a`, never `cp -al`: a hardlinked dist shares an inode with the main checkout, and every
    // compiler truncate-writes in place, so the worktree's own rebuild would overwrite the main
    // checkout's output.
    it('VALID: {one built package, worktree has no dist} => copies with cp -a and never with -al', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [{ name: 'ward', hasSourceDist: true, hasTargetDist: false }],
      });
      proxy.setupCopySucceeds();

      const result = await worktreeSeedDistBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopyArgs()).toStrictEqual([
        '-a',
        '/repo/packages/ward/dist',
        '/repo/worktrees/probe/packages/ward/dist',
      ]);
    });

    it('VALID: {two built packages, neither seeded} => copies the second one to its own package path', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [
          { name: 'shared', hasSourceDist: true, hasTargetDist: false },
          { name: 'ward', hasSourceDist: true, hasTargetDist: false },
        ],
      });
      proxy.setupCopySucceeds();

      const result = await worktreeSeedDistBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopyArgs()).toStrictEqual([
        '-a',
        '/repo/packages/ward/dist',
        '/repo/worktrees/probe/packages/ward/dist',
      ]);
    });
  });

  describe('the per-package done-check', () => {
    it('VALID: {worktree already holds every dist} => copies nothing', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [{ name: 'ward', hasSourceDist: true, hasTargetDist: true }],
      });

      const result = await worktreeSeedDistBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopyArgs()).toBe(undefined);
    });

    it('VALID: {one package seeded, one not} => copies only the one that is missing', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [
          { name: 'shared', hasSourceDist: true, hasTargetDist: true },
          { name: 'ward', hasSourceDist: true, hasTargetDist: false },
        ],
      });
      proxy.setupCopySucceeds();

      const result = await worktreeSeedDistBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopyArgs()).toStrictEqual([
        '-a',
        '/repo/packages/ward/dist',
        '/repo/worktrees/probe/packages/ward/dist',
      ]);
    });
  });

  describe('an unbuilt main checkout', () => {
    it('ERROR: {a package with no source dist} => rejects naming it and copies nothing', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [
          { name: 'shared', hasSourceDist: true, hasTargetDist: false },
          { name: 'ward', hasSourceDist: false, hasTargetDist: false },
        ],
      });

      const error = await worktreeSeedDistBroker({ repoRoot, worktreePath }).catch(
        (thrown: unknown) => thrown,
      );

      expect((error as Error).message).toBe(
        "Worktree preparation failed at seed-dist: /repo/worktrees/probe: the main checkout at /repo has no compiled output for 1 package(s) — run the repo's build before carving a worktree: ward",
      );
      expect(proxy.getCopyArgs()).toBe(undefined);
    });

    it('ERROR: {two packages with no source dist} => names both in one message', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [
          { name: 'shared', hasSourceDist: false, hasTargetDist: false },
          { name: 'ward', hasSourceDist: false, hasTargetDist: false },
        ],
      });

      const error = await worktreeSeedDistBroker({ repoRoot, worktreePath }).catch(
        (thrown: unknown) => thrown,
      );

      expect((error as Error).message).toBe(
        "Worktree preparation failed at seed-dist: /repo/worktrees/probe: the main checkout at /repo has no compiled output for 2 package(s) — run the repo's build before carving a worktree: shared, ward",
      );
      expect(proxy.getCopyArgs()).toBe(undefined);
    });
  });

  describe('directories under packages/ that are not packages', () => {
    it('VALID: {a directory with no package.json and no dist} => is not reported as unbuilt', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [
          { name: 'scratch', isPackage: false, hasSourceDist: false, hasTargetDist: false },
          { name: 'ward', hasSourceDist: true, hasTargetDist: true },
        ],
      });

      const result = await worktreeSeedDistBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopyArgs()).toBe(undefined);
    });
  });

  describe('a repo that is not a monorepo', () => {
    it('EMPTY: {no packages directory} => returns success without copying anything', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackagesDirAbsent();

      const result = await worktreeSeedDistBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCopyArgs()).toBe(undefined);
    });
  });

  describe('a copy that fails', () => {
    it('ERROR: {cp exits non-zero} => rejects carrying cp own output', async () => {
      const proxy = worktreeSeedDistBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [{ name: 'ward', hasSourceDist: true, hasTargetDist: false }],
      });
      proxy.setupCopyFails({ output: 'cp: cannot create directory: No space left on device\n' });

      const error = await worktreeSeedDistBroker({ repoRoot, worktreePath }).catch(
        (thrown: unknown) => thrown,
      );

      expect((error as Error).message).toBe(
        'Worktree preparation failed at seed-dist: /repo/worktrees/probe: cp: cannot create directory: No space left on device\n',
      );
    });
  });
});
