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
    });
  });

  describe('third-party packages', () => {
    it('VALID: {plain third-party dir zod} => links the target copy straight at the source copy', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: 'zod', isDir: true, isSymlink: false }],
      });
      proxy.setupSymlinkSucceeds({ target: FilePathStub({ value: '/repo/node_modules/zod' }) });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '/repo/node_modules/zod',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/zod',
        },
      ]);
    });
  });

  describe('dot entries', () => {
    it('VALID: {dot-entry .bin} => treated as a plain entry and linked straight at the source copy', async () => {
      const proxy = populateOneRootLayerBrokerProxy();
      const sourceRoot = AbsoluteFilePathStub({ value: '/repo' });
      const targetRoot = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/node_modules' }),
        entries: [{ name: '.bin', isDir: true, isSymlink: false }],
      });
      proxy.setupSymlinkSucceeds({ target: FilePathStub({ value: '/repo/node_modules/.bin' }) });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '/repo/node_modules/.bin',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/.bin',
        },
      ]);
    });
  });

  describe('scope children that are not workspace links', () => {
    it('VALID: {scope dir child not a symlink, e.g. @types/node} => links the vendored dir at the source copy instead of skipping it', async () => {
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
      proxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: '/repo/node_modules/@types/node' }),
      });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '/repo/node_modules/@types/node',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@types/node',
        },
      ]);
    });

    it('VALID: {scope dir child is a symlink with an absolute stored target} => links the source copy instead of preserving the absolute target', async () => {
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
      proxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: '/repo/node_modules/@babel/core' }),
      });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '/repo/node_modules/@babel/core',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@babel/core',
        },
      ]);
    });
  });

  describe('adapter rejections propagate', () => {
    it('ERROR: {target node_modules mkdir rejects} => propagates without attempting any symlinks', async () => {
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
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
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
      proxy.setupSymlinkSucceeds({ target: FilePathStub({ value: '/repo/node_modules/zod' }) });
      proxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/shared' }),
      });
      proxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: '/repo/node_modules/@dungeonmaster/orchestrator' }),
      });

      const result = await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ workspacePackageRoots: [] });
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
      proxy.setupSymlinkSucceeds({ target: FilePathStub({ value: '/repo/node_modules/zod' }) });

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
    it('VALID: {target node_modules already holds entries} => writes ZERO symlinks and emits the skip line', async () => {
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

      expect(proxy.getAllSymlinks()).toStrictEqual([]);
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
      proxy.setupSymlinkSucceeds({ target: FilePathStub({ value: '/repo/node_modules/zod' }) });

      await populateOneRootLayerBroker({
        sourceRoot,
        targetRoot,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '/repo/node_modules/zod',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/zod',
        },
      ]);
      expect(streamed).toStrictEqual([
        '— mirroring node_modules: /repo/worktrees/quest-slug-a1b2c3d4 —',
      ]);
    });
  });
});
