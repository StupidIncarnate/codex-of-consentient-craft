import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';

import { populateOneRootLayerBroker } from './populate-one-root-layer-broker';
import { populateOneRootLayerBrokerProxy } from './populate-one-root-layer-broker.proxy';

type StreamedLine = ReturnType<typeof ErrorMessageStub>;

describe('populateOneRootLayerBroker', () => {
  describe('workspace links', () => {
    it('VALID: {scope dir with relative workspace link} => preserves the relative target verbatim under the target scope dir', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@dungeonmaster' }),
        entries: [{ name: 'orchestrator', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/orchestrator' }),
        target: '../../packages/orchestrator',
      });
      proxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: '../../packages/orchestrator' }),
      });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        workspacePackageRoots: [
          {
            sourceRoot: '/repo/packages/orchestrator',
            targetRoot: '/repo/worktrees/quest-slug-a1b2c3d4/packages/orchestrator',
          },
        ],
      });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '../../packages/orchestrator',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@dungeonmaster/orchestrator',
        },
      ]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([]);
    });
  });

  describe('third-party packages', () => {
    it('VALID: {plain third-party dir zod} => hardlinks it into the target node_modules instead of linking the source copy', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: 'zod', isDir: true, isSymlink: false }],
      });
      proxy.setupCopySucceeds();

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/zod', '/repo/worktrees/quest-slug-a1b2c3d4/node_modules'],
      ]);
    });

    it('VALID: {two plain third-party dirs} => hardlinks both in ONE cp invocation', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [
          { name: 'zod', isDir: true, isSymlink: false },
          { name: 'express', isDir: true, isSymlink: false },
        ],
      });
      proxy.setupCopySucceeds();

      await populateOneRootLayerBroker({ sourceRoot, targetRoot, onLine: () => undefined });

      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/zod', '/repo/node_modules/express', '/wt/node_modules'],
      ]);
    });
  });

  describe('dot entries', () => {
    // The whole point of the hardlink: npm's shims inside `.bin` are RELATIVE, so a REAL `.bin`
    // directory resolves them against the worktree's own packages. A symlinked `.bin` resolves them
    // against the main checkout, and every worktree on disk then runs the main checkout's binaries.
    it('VALID: {dot-entry .bin} => hardlinked into the target node_modules, never symlinked at the source', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '.bin', isDir: true, isSymlink: false }],
      });
      proxy.setupCopySucceeds();

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/.bin', '/repo/worktrees/quest-slug-a1b2c3d4/node_modules'],
      ]);
    });
  });

  describe('vite caches', () => {
    // A `.vite-<port>` directory is one dev server's pre-bundled dependency cache. Shared between
    // two trees, each server is answered with the other's modules.
    it('VALID: {.vite-5173 beside zod} => mirrors zod and leaves the vite cache behind', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [
          { name: '.vite-5173', isDir: true, isSymlink: false },
          { name: 'zod', isDir: true, isSymlink: false },
        ],
      });
      proxy.setupCopySucceeds();

      await populateOneRootLayerBroker({ sourceRoot, targetRoot, onLine: () => undefined });

      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/zod', '/wt/node_modules'],
      ]);
    });

    it('EMPTY: {only a vite cache} => copies nothing at all', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '.vite-5174', isDir: true, isSymlink: false }],
      });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllCopyArgs()).toStrictEqual([]);
    });
  });

  describe('scope children that are not workspace links', () => {
    it('VALID: {scope dir child not a symlink, e.g. @types/node} => hardlinks the vendored dir into the target scope dir', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@types', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@types' }),
        entries: [{ name: 'node', isDir: true, isSymlink: false }],
      });
      proxy.setupCopySucceeds();

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        [
          '-al',
          '/repo/node_modules/@types/node',
          '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@types',
        ],
      ]);
    });

    // An ABSOLUTE stored target is the one shape a worktree must never inherit: it points the
    // worktree's dependency tree back at the main checkout, which is what verify-links refuses.
    it('VALID: {scope dir child is a symlink with an absolute stored target} => hardlinks it rather than reproducing the absolute link', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@babel', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@babel' }),
        entries: [{ name: 'core', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/node_modules/@babel/core' }),
        target: '/somewhere/else/entirely/core',
      });
      proxy.setupCopySucceeds();

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        [
          '-al',
          '/repo/node_modules/@babel/core',
          '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@babel',
        ],
      ]);
    });
  });

  describe('adapter rejections propagate', () => {
    it('ERROR: {target node_modules mkdir rejects} => propagates without copying anything', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupMkdirThrows({
        filepath: FilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules' }),
        error: new Error('EACCES: permission denied'),
      });

      await expect(
        populateOneRootLayerBroker({ sourceRoot, targetRoot, onLine: () => undefined }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
      expect(proxy.getAllCopyArgs()).toStrictEqual([]);
    });

    it('ERROR: {scope dir mkdir rejects} => propagates without linking any children in that scope', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
      });
      proxy.setupMkdirThrows({
        filepath: FilePathStub({
          value: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@dungeonmaster',
        }),
        error: new Error('EACCES: permission denied'),
      });

      await expect(
        populateOneRootLayerBroker({ sourceRoot, targetRoot, onLine: () => undefined }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
    });

    // `cp -al` cannot cross filesystems, so a worktree on another mount fails HERE rather than
    // silently falling back to something nobody chose.
    it('ERROR: {cp -al exits non-zero} => rejects naming the target root and carrying cp own output', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/mnt/other/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: 'zod', isDir: true, isSymlink: false }],
      });
      proxy.setupCopyFails({ output: 'cp: cannot create link: Invalid cross-device link\n' });

      const error = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      }).catch((thrown: unknown) => thrown);

      expect((error as Error).message).toBe(
        'node_modules hardlink populate failed for /mnt/other/wt: cp: cannot create link: Invalid cross-device link\n',
      );
    });

    it('ERROR: {scope cp -al exits non-zero} => rejects naming the target scope dir', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@types', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@types' }),
        entries: [{ name: 'node', isDir: true, isSymlink: false }],
      });
      proxy.setupCopyFails({ output: 'cp: cannot create link: Invalid cross-device link\n' });

      const error = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      }).catch((thrown: unknown) => thrown);

      expect((error as Error).message).toBe(
        'node_modules hardlink populate failed for /wt/node_modules/@types: cp: cannot create link: Invalid cross-device link\n',
      );
    });
  });

  describe('workspacePackageRoots return value', () => {
    it('VALID: {one relative workspace link} => workspacePackageRoots contains exactly that package pair', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@dungeonmaster' }),
        entries: [{ name: 'orchestrator', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/orchestrator' }),
        target: '../../packages/orchestrator',
      });
      proxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: '../../packages/orchestrator' }),
      });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        workspacePackageRoots: [
          { sourceRoot: '/repo/packages/orchestrator', targetRoot: '/wt/packages/orchestrator' },
        ],
      });
    });

    it('VALID: {two relative workspace links} => workspacePackageRoots contains both pairs in input order', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@dungeonmaster' }),
        entries: [
          { name: 'orchestrator', isDir: false, isSymlink: true },
          { name: 'shared', isDir: false, isSymlink: true },
        ],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/orchestrator' }),
        target: '../../packages/orchestrator',
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/shared' }),
        target: '../../packages/shared',
      });
      proxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: '../../packages/orchestrator' }),
      });
      proxy.setupSymlinkSucceeds({ target: FilePathStub({ value: '../../packages/shared' }) });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        workspacePackageRoots: [
          { sourceRoot: '/repo/packages/orchestrator', targetRoot: '/wt/packages/orchestrator' },
          { sourceRoot: '/repo/packages/shared', targetRoot: '/wt/packages/shared' },
        ],
      });
    });

    it('VALID: {plain entry, non-symlink scope child, absolute-target scope child} => workspacePackageRoots is empty', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [
          { name: 'zod', isDir: true, isSymlink: false },
          { name: '@dungeonmaster', isDir: true, isSymlink: false },
        ],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@dungeonmaster' }),
        entries: [
          { name: 'shared', isDir: true, isSymlink: false },
          { name: 'orchestrator', isDir: false, isSymlink: true },
        ],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/orchestrator' }),
        target: '/somewhere/else/orchestrator',
      });
      proxy.setupCopySucceeds();

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/zod', '/wt/node_modules'],
        [
          '-al',
          '/repo/node_modules/@dungeonmaster/shared',
          '/repo/node_modules/@dungeonmaster/orchestrator',
          '/wt/node_modules/@dungeonmaster',
        ],
      ]);
    });
  });

  describe('live streaming', () => {
    it('VALID: {target node_modules absent} => onLine receives exactly the mirroring line naming the target root', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: 'zod', isDir: true, isSymlink: false }],
      });
      proxy.setupCopySucceeds();

      await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual([
        '— mirroring node_modules: /repo/worktrees/quest-slug-a1b2c3d4 —',
      ]);
    });
  });

  describe('per-root done-check', () => {
    it('VALID: {target node_modules already holds entries} => copies nothing and emits the skip line', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];

      proxy.setupTargetNodeModulesOnDisk({
        targetRoot,
        entries: [
          { name: 'zod', isDir: false, isSymlink: true },
          { name: '@dungeonmaster', isDir: true, isSymlink: false },
        ],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: 'zod', isDir: true, isSymlink: false }],
      });

      await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(proxy.getAllCopyArgs()).toStrictEqual([]);
      expect(streamed).toStrictEqual([
        '— skip /repo/worktrees/quest-slug-a1b2c3d4 (node_modules already populated) —',
      ]);
    });

    it('VALID: {target node_modules already populated} => still returns the workspace roots discovered from the SOURCE side', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/wt' });

      proxy.setupTargetNodeModulesOnDisk({
        targetRoot,
        entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
      });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules/@dungeonmaster' }),
        entries: [{ name: 'orchestrator', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/orchestrator' }),
        target: '../../packages/orchestrator',
      });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        workspacePackageRoots: [
          { sourceRoot: '/repo/packages/orchestrator', targetRoot: '/wt/packages/orchestrator' },
        ],
      });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([]);
    });

    it('EMPTY: {target node_modules exists but holds no entries} => mirrors anyway and emits the mirroring line', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];

      proxy.setupTargetNodeModulesOnDisk({ targetRoot, entries: [] });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: 'zod', isDir: true, isSymlink: false }],
      });
      proxy.setupCopySucceeds();

      await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/zod', '/repo/worktrees/quest-slug-a1b2c3d4/node_modules'],
      ]);
      expect(streamed).toStrictEqual([
        '— mirroring node_modules: /repo/worktrees/quest-slug-a1b2c3d4 —',
      ]);
    });
  });
});
