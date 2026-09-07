import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { bundleBuildBroker } from './bundle-build-broker';
import { bundleBuildBrokerProxy } from './bundle-build-broker.proxy';

// The sha-256 of the four files bundleBuildBrokerProxy.setupWorkspace() stages, in sorted path
// order. Editing any staged content changes this number.
const BUNDLE_HASH = 'f740c8e2713632d9ec1dd0c6ef7ed6aa0e0df74273dc7210276c1a2f5c1e3d22';
const BUNDLE_PARENT = '/project/packages/web/.ward/bundle';
const BUNDLE_DIR = `${BUNDLE_PARENT}/${BUNDLE_HASH}`;
const TEMP_DIR = `${BUNDLE_PARENT}/.tmp-${String(process.pid)}`;

describe('bundleBuildBroker', () => {
  describe('a bundle for these inputs already exists', () => {
    it('VALID: {the hash directory is on disk} => returns it without building', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupCachedBundle({ hash: BUNDLE_HASH });

      const result = await bundleBuildBroker({ packageRoot });

      expect(result).toStrictEqual({ bundleDir: BUNDLE_DIR, error: null });
    });

    it('VALID: {the hash directory is on disk} => spawns no build', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupCachedBundle({ hash: BUNDLE_HASH });

      await bundleBuildBroker({ packageRoot });

      expect(proxy.getSpawnedArgs()).toBe(undefined);
    });
  });

  describe('no bundle for these inputs yet', () => {
    it('VALID: {no hash directory} => builds into a pid-named temp directory and returns the hash directory', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupNoCachedBundle({ hash: BUNDLE_HASH });
      proxy.setupBuildSucceeds();
      proxy.setupPublishWins({ hash: BUNDLE_HASH });

      const result = await bundleBuildBroker({ packageRoot });

      expect(result).toStrictEqual({ bundleDir: BUNDLE_DIR, error: null });
    });

    it('VALID: {no hash directory} => runs the package build script with the temp directory as outDir', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupNoCachedBundle({ hash: BUNDLE_HASH });
      proxy.setupBuildSucceeds();
      proxy.setupPublishWins({ hash: BUNDLE_HASH });

      await bundleBuildBroker({ packageRoot });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', 'build', '--', '--outDir', TEMP_DIR]);
      expect(proxy.getSpawnedCwd()).toBe('/project/packages/web');
    });

    // Publishing is a rename ONTO the hash directory, never a write INSIDE one. A concurrent run
    // may already be serving files out of that directory.
    it('VALID: {the build succeeded} => publishes by renaming the temp directory onto the hash', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupNoCachedBundle({ hash: BUNDLE_HASH });
      proxy.setupBuildSucceeds();
      proxy.setupPublishWins({ hash: BUNDLE_HASH });

      await bundleBuildBroker({ packageRoot });

      expect(proxy.getPublishCalls()).toStrictEqual([[TEMP_DIR, BUNDLE_DIR]]);
    });
  });

  describe('a sibling run published this hash first', () => {
    it('EDGE: {the rename is refused} => discards the temp copy and still returns the hash directory', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupNoCachedBundle({ hash: BUNDLE_HASH });
      proxy.setupBuildSucceeds();
      proxy.setupPublishLoses({ hash: BUNDLE_HASH });

      const result = await bundleBuildBroker({ packageRoot });

      expect(result).toStrictEqual({ bundleDir: BUNDLE_DIR, error: null });
    });

    it('EDGE: {the rename is refused} => removes the temp directory it built', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupNoCachedBundle({ hash: BUNDLE_HASH });
      proxy.setupBuildSucceeds();
      proxy.setupPublishLoses({ hash: BUNDLE_HASH });

      await bundleBuildBroker({ packageRoot });

      expect(proxy.getRemovedTempPaths()).toStrictEqual([
        [TEMP_DIR, { recursive: true, force: true }],
        [TEMP_DIR, { recursive: true, force: true }],
      ]);
    });
  });

  describe('the build fails', () => {
    it('ERROR: {a non-zero build exit} => returns no bundle and the build output', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupNoCachedBundle({ hash: BUNDLE_HASH });
      proxy.setupBuildFails({ output: 'Could not resolve ./missing' });

      const result = await bundleBuildBroker({ packageRoot });

      expect(result).toStrictEqual({
        bundleDir: null,
        error: 'bundle build failed in /project/packages/web:\nCould not resolve ./missing',
      });
    });

    it('ERROR: {a non-zero build exit} => leaves no temp directory behind', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupWorkspace();
      proxy.setupNoCachedBundle({ hash: BUNDLE_HASH });
      proxy.setupBuildFails({ output: 'Could not resolve ./missing' });

      await bundleBuildBroker({ packageRoot });

      expect(proxy.getRemovedTempPaths()).toStrictEqual([
        [TEMP_DIR, { recursive: true, force: true }],
        [TEMP_DIR, { recursive: true, force: true }],
      ]);
    });
  });

  describe('the package cannot produce a bundle', () => {
    // Nothing but the manifest read is staged here, so any attempt to walk the closure or glob a
    // package would throw on an unstaged call rather than pass quietly.
    it('EMPTY: {no build script} => returns no bundle and no error', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const proxy = bundleBuildBrokerProxy();
      proxy.setupNoBuildScript();

      const result = await bundleBuildBroker({ packageRoot });

      expect(result).toStrictEqual({ bundleDir: null, error: null });
    });
  });
});
