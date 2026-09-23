import { laneWorkspaceResolveBroker } from './lane-workspace-resolve-broker';
import { laneWorkspaceResolveBrokerProxy } from './lane-workspace-resolve-broker.proxy';
import type { LaneWorkspaceNoneMatchedError } from '../../../errors/lane-workspace-none-matched/lane-workspace-none-matched-error';
import { LaneWorkspaceSeveralMatchedError } from '../../../errors/lane-workspace-several-matched/lane-workspace-several-matched-error';
import {
  AbsoluteFilePathStub,
  PackageTypeStub,
  PackageNameStub,
} from '@dungeonmaster/shared/contracts';

describe('laneWorkspaceResolveBroker', () => {
  describe('exactly one package answers the kind', () => {
    it("VALID: {packageType: http-backend, one hono package among two} => resolves that package's name", async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({ repoRoot, packageNames: ['server', 'shared'] });
      proxy.setupPackage({
        repoRoot,
        dirName: 'server',
        packageName: '@dungeonmaster/server',
        adapterDirNames: ['hono'],
      });
      proxy.setupPackage({ repoRoot, dirName: 'shared', packageName: '@dungeonmaster/shared' });

      const result = await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'http-backend' }),
      });

      expect(result).toBe('@dungeonmaster/server');
    });

    it("VALID: {packageType: frontend-react, one widgets+react package among two} => resolves that package's name", async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({ repoRoot, packageNames: ['web', 'shared'] });
      proxy.setupPackage({
        repoRoot,
        dirName: 'web',
        packageName: '@dungeonmaster/web',
        srcDirNames: ['widgets'],
        dependencies: { react: '18.2.0' },
      });
      proxy.setupPackage({ repoRoot, dirName: 'shared', packageName: '@dungeonmaster/shared' });

      const result = await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'frontend-react' }),
      });

      expect(result).toBe('@dungeonmaster/web');
    });
  });

  describe('a non-directory entry under packages/', () => {
    it('VALID: {a stray file alongside one hono package} => the file is never probed, and the directory still resolves', async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({
        repoRoot,
        packageNames: ['server'],
        fileNames: ['CLAUDE.md'],
      });
      proxy.setupPackage({
        repoRoot,
        dirName: 'server',
        packageName: '@dungeonmaster/server',
        adapterDirNames: ['hono'],
      });

      const result = await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'http-backend' }),
      });

      expect(result).toBe('@dungeonmaster/server');
    });
  });

  describe('a package whose winning kind is not the requested one', () => {
    it('VALID: {packageType: frontend-react, a hono package that ALSO carries widgets+react} => still resolves it, because the SET (not the winning label) decides', async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({ repoRoot, packageNames: ['server'] });
      proxy.setupPackage({
        repoRoot,
        dirName: 'server',
        packageName: '@dungeonmaster/server',
        adapterDirNames: ['hono'],
        srcDirNames: ['widgets'],
        dependencies: { react: '18.2.0' },
      });

      const result = await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'frontend-react' }),
      });

      expect(result).toBe('@dungeonmaster/server');
    });
  });

  describe('no package answers the kind', () => {
    it('ERROR: {packageType: http-backend, no hono/express package on disk} => throws LaneWorkspaceNoneMatchedError naming the repo and kind', async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({ repoRoot, packageNames: ['shared', 'web'] });
      proxy.setupPackage({ repoRoot, dirName: 'shared', packageName: '@dungeonmaster/shared' });
      proxy.setupPackage({
        repoRoot,
        dirName: 'web',
        packageName: '@dungeonmaster/web',
        srcDirNames: ['widgets'],
      });

      const caughtError = (await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'http-backend' }),
      }).catch((error: unknown) => error)) as LaneWorkspaceNoneMatchedError;

      expect({ name: caughtError.name, message: caughtError.message }).toStrictEqual({
        name: 'LaneWorkspaceNoneMatchedError',
        message:
          'No package under "/repo/packages" detected as packageType "http-backend". A lane spec\'s ' +
          '"--workspace=<name>" needs exactly one such package to resolve the token against — add one, ' +
          'or point the spec at a repo that has one.',
      });
    });
  });

  describe('several packages answer the kind', () => {
    it('ERROR: {packageType: http-backend, two hono packages} => throws LaneWorkspaceSeveralMatchedError naming both', async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({ repoRoot, packageNames: ['server', 'gateway'] });
      proxy.setupPackage({
        repoRoot,
        dirName: 'server',
        packageName: '@dungeonmaster/server',
        adapterDirNames: ['hono'],
      });
      proxy.setupPackage({
        repoRoot,
        dirName: 'gateway',
        packageName: '@dungeonmaster/gateway',
        adapterDirNames: ['express'],
      });

      const caughtError = (await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'http-backend' }),
      }).catch((error: unknown) => error)) as LaneWorkspaceSeveralMatchedError;

      expect({ name: caughtError.name, message: caughtError.message }).toStrictEqual({
        name: 'LaneWorkspaceSeveralMatchedError',
        message:
          '2 packages under "/repo/packages" detected as packageType "http-backend": ' +
          '@dungeonmaster/server, @dungeonmaster/gateway. A lane spec\'s "--workspace=<name>" needs ' +
          'exactly one — narrow the repo, or give the spec its own explicit workspace name instead of ' +
          'this token.',
      });
    });
  });

  describe('error instances carry PackageName-shaped matches', () => {
    it('VALID: {two http-backend packages} => the thrown error is a real LaneWorkspaceSeveralMatchedError instance', async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({ repoRoot, packageNames: ['server', 'gateway'] });
      proxy.setupPackage({
        repoRoot,
        dirName: 'server',
        packageName: '@dungeonmaster/server',
        adapterDirNames: ['hono'],
      });
      proxy.setupPackage({
        repoRoot,
        dirName: 'gateway',
        packageName: '@dungeonmaster/gateway',
        adapterDirNames: ['express'],
      });

      const caughtError = await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'http-backend' }),
      }).catch((error: unknown) => error);

      expect(caughtError instanceof LaneWorkspaceSeveralMatchedError).toBe(true);
    });
  });

  describe('a matched package name re-brands through packageNameContract', () => {
    it('VALID: {one http-backend package} => the resolved value equals the PackageName stub for it', async () => {
      const proxy = laneWorkspaceResolveBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupPackagesDir({ repoRoot, packageNames: ['server'] });
      proxy.setupPackage({
        repoRoot,
        dirName: 'server',
        packageName: '@dungeonmaster/server',
        adapterDirNames: ['hono'],
      });

      const result = await laneWorkspaceResolveBroker({
        repoRoot,
        packageType: PackageTypeStub({ value: 'http-backend' }),
      });

      expect(result).toBe(PackageNameStub({ value: '@dungeonmaster/server' }));
    });
  });
});
