import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { walkSymlinksLayerBroker } from './walk-symlinks-layer-broker';
import { walkSymlinksLayerBrokerProxy } from './walk-symlinks-layer-broker.proxy';

describe('walkSymlinksLayerBroker', () => {
  describe('relative targets inside the worktree', () => {
    it('VALID: {workspace link ../../packages/ward} => records it relative and inside', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'ward-link', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/ward-link' }),
        target: '../packages/ward',
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([
        {
          linkPath: '/repo/worktrees/probe/node_modules/ward-link',
          storedTarget: '../packages/ward',
          resolvedTarget: '/repo/worktrees/probe/packages/ward',
          relative: true,
          inside: true,
        },
      ]);
    });
  });

  describe('absolute targets', () => {
    it('VALID: {link stored as an absolute main-checkout path} => records it not relative and not inside', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'zod', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/zod' }),
        target: '/repo/node_modules/zod',
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([
        {
          linkPath: '/repo/worktrees/probe/node_modules/zod',
          storedTarget: '/repo/node_modules/zod',
          resolvedTarget: '/repo/node_modules/zod',
          relative: false,
          inside: false,
        },
      ]);
    });
  });

  describe('relative targets that climb out of the worktree', () => {
    it('VALID: {relative target walking up past the worktree root} => records it relative but not inside', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'escapee', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/escapee' }),
        target: '../../../packages/ward',
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([
        {
          linkPath: '/repo/worktrees/probe/node_modules/escapee',
          storedTarget: '../../../packages/ward',
          resolvedTarget: '/repo/packages/ward',
          relative: true,
          inside: false,
        },
      ]);
    });

    // The trailing-separator test in the implementation: a sibling worktree whose name merely
    // STARTS with this worktree's name is outside it, and a bare prefix comparison would miss that.
    it('EDGE: {target landing in a sibling worktree with a name-prefix collision} => records it not inside', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'sibling', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/sibling' }),
        target: '../../probe-two/packages/ward',
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([
        {
          linkPath: '/repo/worktrees/probe/node_modules/sibling',
          storedTarget: '../../probe-two/packages/ward',
          resolvedTarget: '/repo/worktrees/probe-two/packages/ward',
          relative: true,
          inside: false,
        },
      ]);
    });
  });

  describe('recursion', () => {
    it('VALID: {real subdirectory holding a link} => descends into it and records the nested link', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: '.bin', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules/.bin' }),
        entries: [{ name: 'dungeonmaster-ward', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({
          value: '/repo/worktrees/probe/node_modules/.bin/dungeonmaster-ward',
        }),
        target: '../@dungeonmaster/ward/dist/bin/ward-entry.js',
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([
        {
          linkPath: '/repo/worktrees/probe/node_modules/.bin/dungeonmaster-ward',
          storedTarget: '../@dungeonmaster/ward/dist/bin/ward-entry.js',
          resolvedTarget:
            '/repo/worktrees/probe/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js',
          relative: true,
          inside: true,
        },
      ]);
    });

    // Following a symlinked directory walks out of the tree under audit, and on a cycle never
    // returns. The link itself is already the row the audit needs. The linked directory is given
    // REAL contents here — an escaping link of its own — so a walk that descended would come back
    // with two rows instead of one.
    it('VALID: {symlinked directory holding its own escaping link} => records only the link itself, never its contents', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'linked-dir', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/linked-dir' }),
        target: '../packages/shared',
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules/linked-dir' }),
        entries: [{ name: 'inner', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/linked-dir/inner' }),
        target: '/repo/node_modules/inner',
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([
        {
          linkPath: '/repo/worktrees/probe/node_modules/linked-dir',
          storedTarget: '../packages/shared',
          resolvedTarget: '/repo/worktrees/probe/packages/shared',
          relative: true,
          inside: true,
        },
      ]);
    });
  });

  describe('non-link entries', () => {
    it('EMPTY: {plain files only} => returns no audit rows', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: '.package-lock.json', isDir: false, isSymlink: false }],
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([]);
    });

    // `filePathContract` rejects exactly one shape — a bare relative path with no `./` or `../`
    // lead — and `fsReadlinkAdapter` answers null for it. That shape cannot climb out of the tree
    // it starts in, so there is nothing for the audit to record.
    it('EMPTY: {symlink whose stored target the path contract cannot brand} => returns no audit rows', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'bare', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/bare' }),
        target: 'zod/index.js',
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {readlink rejects} => returns no audit rows', async () => {
      const proxy = walkSymlinksLayerBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'broken', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkThrows({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/broken' }),
        error: new Error('EINVAL: invalid argument'),
      });

      const result = await walkSymlinksLayerBroker({
        worktreePath,
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
