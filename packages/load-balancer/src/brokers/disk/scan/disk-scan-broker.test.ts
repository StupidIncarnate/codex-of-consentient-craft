import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { DiskItemStub } from '../../../contracts/disk-item/disk-item.stub';
import { diskStoresStatics } from '../../../statics/disk-stores/disk-stores-statics';
import { diskScanBroker } from './disk-scan-broker';
import { diskScanBrokerProxy } from './disk-scan-broker.proxy';

type DiskItem = ReturnType<typeof DiskItemStub>;

describe('diskScanBroker', () => {
  describe('repoRoots filtering', () => {
    it('EDGE: {repoRoots: [missingRoot]} => skips non-existent repo roots', async () => {
      const proxy = diskScanBrokerProxy();
      proxy.setupRepoRoot({ path: '/repo-missing', exists: false });

      const result = await diskScanBroker({ repoRoots: ['/repo-missing'] });

      expect(result).toStrictEqual({ items: [], skipped: 0 });
    });

    it('EDGE: {repoRoots: [dupRoot, dupRoot]} => deduplicates repo roots', async () => {
      const proxy = diskScanBrokerProxy();
      proxy.setupRepoRoot({ path: '/repo-dup', exists: true });
      proxy.setupReaddir({ path: '/repo-dup/packages', names: [] });
      proxy.setupReaddir({
        path: join('/repo-dup', locationsStatics.repoRoot.wardLocalDir),
        names: ['run-1.json'],
      });
      proxy.setupLstatFile({
        path: join('/repo-dup', locationsStatics.repoRoot.wardLocalDir, 'run-1.json'),
        sizeBytes: 150,
        mtimeMs: 1000,
      });

      const result = await diskScanBroker({ repoRoots: ['/repo-dup', '/repo-dup'] });

      expect(result).toStrictEqual({
        items: [
          DiskItemStub({
            storeId: 'ward-run-results',
            path: join('/repo-dup', locationsStatics.repoRoot.wardLocalDir, 'run-1.json'),
            bytes: 150,
            mtimeMs: 1000,
            protectedReason: 'newest-per-repo',
          }),
        ],
        skipped: 0,
      });
    });
  });

  describe('ward-run-results', () => {
    it('VALID: {runResults: [run1, run2, run3]} => newest per repo is protected with newest-per-repo', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/my-repo';
      const wardDir = join(repo, locationsStatics.repoRoot.wardLocalDir);

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: [] });
      proxy.setupReaddir({
        path: wardDir,
        names: ['run-old.json', 'run-mid.json', 'run-newest.json'],
      });
      proxy.setupLstatFile({
        path: join(wardDir, 'run-old.json'),
        sizeBytes: 100,
        mtimeMs: 1000,
      });
      proxy.setupLstatFile({
        path: join(wardDir, 'run-mid.json'),
        sizeBytes: 200,
        mtimeMs: 2000,
      });
      proxy.setupLstatFile({
        path: join(wardDir, 'run-newest.json'),
        sizeBytes: 300,
        mtimeMs: 3000,
      });

      const result = await diskScanBroker({ repoRoots: [repo] });

      const runResults = result.items.filter(
        (item: DiskItem) => item.storeId === 'ward-run-results',
      );

      expect(runResults).toStrictEqual([
        DiskItemStub({
          storeId: 'ward-run-results',
          path: join(wardDir, 'run-old.json'),
          bytes: 100,
          mtimeMs: 1000,
          protectedReason: null,
        }),
        DiskItemStub({
          storeId: 'ward-run-results',
          path: join(wardDir, 'run-mid.json'),
          bytes: 200,
          mtimeMs: 2000,
          protectedReason: null,
        }),
        DiskItemStub({
          storeId: 'ward-run-results',
          path: join(wardDir, 'run-newest.json'),
          bytes: 300,
          mtimeMs: 3000,
          protectedReason: 'newest-per-repo',
        }),
      ]);
    });
  });

  describe('ward-bundle-cache', () => {
    it('VALID: {bundleCache} => calculates folder size recursively and sets protectedReason to null', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/bundle-repo';
      const wardDir = locationsStatics.repoRoot.wardLocalDir;
      const bDir = join(repo, 'packages', 'web', wardDir, 'bundle');
      const bundle1 = join(bDir, 'hash1');

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: ['web'] });
      proxy.setupReaddir({ path: bDir, names: ['hash1'] });
      proxy.setupLstatDirectory({ path: bundle1, mtimeMs: 5000 });
      proxy.setupReaddir({ path: bundle1, names: ['file1.js', 'sub'] });
      proxy.setupLstatFile({ path: join(bundle1, 'file1.js'), sizeBytes: 250, mtimeMs: 5000 });
      proxy.setupLstatDirectory({ path: join(bundle1, 'sub'), mtimeMs: 5000 });
      proxy.setupReaddir({ path: join(bundle1, 'sub'), names: ['file2.js'] });
      proxy.setupLstatFile({
        path: join(bundle1, 'sub', 'file2.js'),
        sizeBytes: 150,
        mtimeMs: 5000,
      });

      const result = await diskScanBroker({ repoRoots: [repo] });

      const bundles = result.items.filter((item: DiskItem) => item.storeId === 'ward-bundle-cache');

      expect(bundles).toStrictEqual([
        DiskItemStub({
          storeId: 'ward-bundle-cache',
          path: bundle1,
          bytes: 400,
          mtimeMs: 5000,
          protectedReason: null,
        }),
      ]);
    });
  });

  describe('e2e-test-results', () => {
    it('VALID: {portActive, age <= 24h} => protectedReason is port-in-use:<port>', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/e2e-repo';
      const portDir = join(repo, 'packages', 'web', 'test-results', '4173');

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: ['web'] });
      proxy.setupReaddir({ path: join(repo, 'packages', 'web', 'test-results'), names: ['4173'] });
      proxy.setupLstatDirectory({ path: portDir, mtimeMs: 1_000_000 });
      proxy.setupReaddir({ path: portDir, names: ['trace.zip'] });
      proxy.setupLstatFile({
        path: join(portDir, 'trace.zip'),
        sizeBytes: 800,
        mtimeMs: 1_000_000,
      });
      proxy.setupPortInUse({ port: 4173 });

      const result = await diskScanBroker({ repoRoots: [repo], nowMs: 1_000_000 + 10_000 });

      const e2eResults = result.items.filter(
        (item: DiskItem) => item.storeId === 'e2e-test-results',
      );

      expect(e2eResults).toStrictEqual([
        DiskItemStub({
          storeId: 'e2e-test-results',
          path: portDir,
          bytes: 800,
          mtimeMs: 1_000_000,
          protectedReason: 'port-in-use:4173',
        }),
      ]);
    });

    it('VALID: {portOrphaned, age > 24h} => protectedReason is null even if port in use', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/e2e-repo';
      const portDir = join(repo, 'packages', 'web', 'test-results', '4173');

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: ['web'] });
      proxy.setupReaddir({ path: join(repo, 'packages', 'web', 'test-results'), names: ['4173'] });
      proxy.setupLstatDirectory({ path: portDir, mtimeMs: 1_000_000 });
      proxy.setupReaddir({ path: portDir, names: [] });
      proxy.setupPortInUse({ port: 4173 });

      const ageOver24h = diskStoresStatics.orphanedPortTimeoutMs + 5000;
      const result = await diskScanBroker({ repoRoots: [repo], nowMs: 1_000_000 + ageOver24h });

      const e2eResults = result.items.filter(
        (item: DiskItem) => item.storeId === 'e2e-test-results',
      );

      expect(e2eResults).toStrictEqual([
        DiskItemStub({
          storeId: 'e2e-test-results',
          path: portDir,
          bytes: 0,
          mtimeMs: 1_000_000,
          protectedReason: null,
        }),
      ]);
    });

    it('VALID: {portFree} => protectedReason is null', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/e2e-repo';
      const portDir = join(repo, 'packages', 'web', 'test-results', '4173');

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: ['web'] });
      proxy.setupReaddir({ path: join(repo, 'packages', 'web', 'test-results'), names: ['4173'] });
      proxy.setupLstatDirectory({ path: portDir, mtimeMs: 1_000_000 });
      proxy.setupReaddir({ path: portDir, names: [] });
      proxy.setupPortFree({ port: 4173 });

      const result = await diskScanBroker({ repoRoots: [repo], nowMs: 1_000_000 + 5000 });

      const e2eResults = result.items.filter(
        (item: DiskItem) => item.storeId === 'e2e-test-results',
      );

      expect(e2eResults).toStrictEqual([
        DiskItemStub({
          storeId: 'e2e-test-results',
          path: portDir,
          bytes: 0,
          mtimeMs: 1_000_000,
          protectedReason: null,
        }),
      ]);
    });
  });

  describe('e2e-vite-cache', () => {
    it('VALID: {portActive, age <= 24h} => protectedReason is port-in-use:<port>', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/vite-repo';
      const nodeMod = locationsStatics.repoRoot.nodeModules;
      const viteDir = join(repo, nodeMod, '.vite-5173');

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: [] });
      proxy.setupReaddir({ path: join(repo, nodeMod), names: ['.vite-5173'] });
      proxy.setupLstatDirectory({ path: viteDir, mtimeMs: 2_000_000 });
      proxy.setupReaddir({ path: viteDir, names: ['deps.js'] });
      proxy.setupLstatFile({ path: join(viteDir, 'deps.js'), sizeBytes: 600, mtimeMs: 2_000_000 });
      proxy.setupPortInUse({ port: 5173 });

      const result = await diskScanBroker({ repoRoots: [repo], nowMs: 2_000_000 + 10_000 });

      const viteItems = result.items.filter((item: DiskItem) => item.storeId === 'e2e-vite-cache');

      expect(viteItems).toStrictEqual([
        DiskItemStub({
          storeId: 'e2e-vite-cache',
          path: viteDir,
          bytes: 600,
          mtimeMs: 2_000_000,
          protectedReason: 'port-in-use:5173',
        }),
      ]);
    });
  });

  describe('e2e-playwright-reports', () => {
    it('VALID: {playwrightReport} => protectedReason is null', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/report-repo';
      const reportFile = join(repo, '.ward-playwright-report-3000.json');

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: [] });
      proxy.setupReaddir({ path: repo, names: ['.ward-playwright-report-3000.json'] });
      proxy.setupLstatFile({ path: reportFile, sizeBytes: 1200, mtimeMs: 500_000 });

      const result = await diskScanBroker({ repoRoots: [repo] });

      const reportItems = result.items.filter(
        (item: DiskItem) => item.storeId === 'e2e-playwright-reports',
      );

      expect(reportItems).toStrictEqual([
        DiskItemStub({
          storeId: 'e2e-playwright-reports',
          path: reportFile,
          bytes: 1200,
          mtimeMs: 500_000,
          protectedReason: null,
        }),
      ]);
    });
  });

  describe('jest-transform-cache', () => {
    it('VALID: {jestCache} => top-level entries have protectedReason null', async () => {
      const proxy = diskScanBrokerProxy();
      const fakeTmp = '/fake-tmp';
      const jDir = join(fakeTmp, 'jest_user');
      const hashDir = join(jDir, 'abc123hash');

      proxy.setupReaddir({ path: fakeTmp, names: ['jest_user'] });
      proxy.setupReaddir({ path: jDir, names: ['abc123hash'] });
      proxy.setupLstatDirectory({ path: hashDir, mtimeMs: 1234 });
      proxy.setupReaddir({ path: hashDir, names: ['compiled.js'] });
      proxy.setupLstatFile({ path: join(hashDir, 'compiled.js'), sizeBytes: 900, mtimeMs: 1234 });

      const result = await diskScanBroker({ repoRoots: [], tmpDir: fakeTmp });

      const jestItems = result.items.filter(
        (item: DiskItem) => item.storeId === 'jest-transform-cache',
      );

      expect(jestItems).toStrictEqual([
        DiskItemStub({
          storeId: 'jest-transform-cache',
          path: hashDir,
          bytes: 900,
          mtimeMs: 1234,
          protectedReason: null,
        }),
      ]);
    });
  });

  describe('e2e-sandboxes & jest-test-sandboxes', () => {
    it('VALID: {e2eSandbox, livePid} => protectedReason is pid-alive:<pid>', async () => {
      const proxy = diskScanBrokerProxy();
      const fakeTmp = '/fake-tmp';
      const sandboxDir = join(fakeTmp, 'dm-e2e-54321-fixture');

      proxy.setupReaddir({ path: fakeTmp, names: ['dm-e2e-54321-fixture'] });
      proxy.setupLstatDirectory({ path: sandboxDir, mtimeMs: 7000 });
      proxy.setupReaddir({ path: sandboxDir, names: [] });
      proxy.setupPidAlive({ pid: 54321 });

      const result = await diskScanBroker({ repoRoots: [], tmpDir: fakeTmp });

      const items = result.items.filter((item: DiskItem) => item.storeId === 'e2e-sandboxes');

      expect(items).toStrictEqual([
        DiskItemStub({
          storeId: 'e2e-sandboxes',
          path: sandboxDir,
          bytes: 0,
          mtimeMs: 7000,
          protectedReason: 'pid-alive:54321',
        }),
      ]);
    });

    it('VALID: {e2eSandbox, deadPid} => protectedReason is null', async () => {
      const proxy = diskScanBrokerProxy();
      const fakeTmp = '/fake-tmp';
      const sandboxDir = join(fakeTmp, 'dm-e2e-999999');

      proxy.setupReaddir({ path: fakeTmp, names: ['dm-e2e-999999'] });
      proxy.setupLstatDirectory({ path: sandboxDir, mtimeMs: 7000 });
      proxy.setupReaddir({ path: sandboxDir, names: [] });
      proxy.setupPidDead({ pid: 999999 });

      const result = await diskScanBroker({ repoRoots: [], tmpDir: fakeTmp });

      const items = result.items.filter((item: DiskItem) => item.storeId === 'e2e-sandboxes');

      expect(items).toStrictEqual([
        DiskItemStub({
          storeId: 'e2e-sandboxes',
          path: sandboxDir,
          bytes: 0,
          mtimeMs: 7000,
          protectedReason: null,
        }),
      ]);
    });

    it('VALID: {jestTestSandbox, livePid} => protectedReason is pid-alive:<pid>', async () => {
      const proxy = diskScanBrokerProxy();
      const fakeTmp = '/fake-tmp';
      const jestHomeDir = join(fakeTmp, 'dungeonmaster-jest-home-67890');

      proxy.setupReaddir({ path: fakeTmp, names: ['dungeonmaster-jest-home-67890'] });
      proxy.setupLstatDirectory({ path: jestHomeDir, mtimeMs: 8000 });
      proxy.setupReaddir({ path: jestHomeDir, names: [] });
      proxy.setupPidAlive({ pid: 67890 });

      const result = await diskScanBroker({ repoRoots: [], tmpDir: fakeTmp });

      const items = result.items.filter((item: DiskItem) => item.storeId === 'jest-test-sandboxes');

      expect(items).toStrictEqual([
        DiskItemStub({
          storeId: 'jest-test-sandboxes',
          path: jestHomeDir,
          bytes: 0,
          mtimeMs: 8000,
          protectedReason: 'pid-alive:67890',
        }),
      ]);
    });
  });

  describe('siegelense-sandboxes & siegelense-evidence', () => {
    it('VALID: {siegelenseSandbox, activeInstance} => protectedReason is siegelense-instance-alive', async () => {
      const proxy = diskScanBrokerProxy();
      const fakeTmp = '/fake-tmp';
      const fakeHome = '/fake-dm-home';
      const siegeDir = join(fakeTmp, 'dm-siege-inst_abc123');

      proxy.setupReaddir({ path: fakeTmp, names: ['dm-siege-inst_abc123'] });
      proxy.setupLstatDirectory({ path: siegeDir, mtimeMs: 9000 });
      proxy.setupReaddir({ path: siegeDir, names: [] });

      const regPath = join(
        fakeHome,
        locationsStatics.siegelense.dir,
        locationsStatics.siegelense.registry,
      );
      proxy.setupJsonFile({
        path: regPath,
        data: {
          instances: [{ id: 'inst_abc123', state: 'alive', pid: '11223' }],
        },
      });
      proxy.setupPidAlive({ pid: 11223 });

      const result = await diskScanBroker({
        repoRoots: [],
        tmpDir: fakeTmp,
        dungeonmasterHome: fakeHome,
      });

      const items = result.items.filter(
        (item: DiskItem) => item.storeId === 'siegelense-sandboxes',
      );

      expect(items).toStrictEqual([
        DiskItemStub({
          storeId: 'siegelense-sandboxes',
          path: siegeDir,
          bytes: 0,
          mtimeMs: 9000,
          protectedReason: 'siegelense-instance-alive',
        }),
      ]);
    });

    it('VALID: {siegelenseEvidence, citedByOpenQuest} => protectedReason is siegelense-instance-alive', async () => {
      const proxy = diskScanBrokerProxy();
      const fakeHome = '/fake-dm-home';
      const siegeRoot = join(fakeHome, locationsStatics.siegelense.dir);
      const unownedInstances = join(
        siegeRoot,
        locationsStatics.siegelense.unownedDir,
        locationsStatics.siegelense.instancesDir,
      );
      const instDir = join(unownedInstances, 'inst_quest_cited');

      proxy.setupReaddir({ path: unownedInstances, names: ['inst_quest_cited'] });
      proxy.setupLstatDirectory({ path: instDir, mtimeMs: 9500 });
      proxy.setupReaddir({ path: instDir, names: ['api.log'] });
      proxy.setupLstatFile({ path: join(instDir, 'api.log'), sizeBytes: 500, mtimeMs: 9500 });

      const regPath = join(siegeRoot, locationsStatics.siegelense.registry);
      proxy.setupJsonFile({
        path: regPath,
        data: {
          instances: [
            {
              id: 'inst_quest_cited',
              state: 'dead',
              questId: 'quest_1',
              guildId: 'guild_1',
            },
          ],
        },
      });

      const questPath = join(
        fakeHome,
        locationsStatics.dungeonmasterHome.guildsDir,
        'guild_1',
        locationsStatics.guild.questsDir,
        'quest_1',
        locationsStatics.quest.questFile,
      );
      proxy.setupJsonFile({
        path: questPath,
        data: {
          status: 'in_progress',
        },
      });

      const result = await diskScanBroker({
        repoRoots: [],
        dungeonmasterHome: fakeHome,
      });

      const items = result.items.filter((item: DiskItem) => item.storeId === 'siegelense-evidence');

      expect(items).toStrictEqual([
        DiskItemStub({
          storeId: 'siegelense-evidence',
          path: instDir,
          bytes: 500,
          mtimeMs: 9500,
          protectedReason: 'siegelense-instance-alive',
        }),
      ]);
    });
  });

  describe('symlinks and error handling', () => {
    it('EDGE: {symlink} => calculates symlink size without traversing into target', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/symlink-repo';
      const wardDir = locationsStatics.repoRoot.wardLocalDir;
      const bDir = join(repo, 'packages', 'core', wardDir, 'bundle');
      const bundleDir = join(bDir, 'bundle1');

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: ['core'] });
      proxy.setupReaddir({ path: bDir, names: ['bundle1'] });
      proxy.setupLstatDirectory({ path: bundleDir, mtimeMs: 4000 });
      proxy.setupReaddir({ path: bundleDir, names: ['link_to_outside'] });
      proxy.setupLstatSymlink({
        path: join(bundleDir, 'link_to_outside'),
        sizeBytes: 35,
        mtimeMs: 4000,
      });

      const result = await diskScanBroker({ repoRoots: [repo] });

      const items = result.items.filter((item: DiskItem) => item.storeId === 'ward-bundle-cache');

      expect(items).toStrictEqual([
        DiskItemStub({
          storeId: 'ward-bundle-cache',
          path: bundleDir,
          bytes: 35,
          mtimeMs: 4000,
          protectedReason: null,
        }),
      ]);
    });

    it('ERROR: {unreadableFile} => catches error, skips item, increments skipped', async () => {
      const proxy = diskScanBrokerProxy();
      const repo = '/error-repo';
      const wardDir = locationsStatics.repoRoot.wardLocalDir;

      proxy.setupRepoRoot({ path: repo, exists: true });
      proxy.setupReaddir({ path: join(repo, 'packages'), names: [] });
      proxy.setupReaddir({ path: join(repo, wardDir), names: ['run-broken.json'] });
      proxy.setupLstatError({
        path: join(repo, wardDir, 'run-broken.json'),
        code: 'EACCES',
      });

      const result = await diskScanBroker({ repoRoots: [repo] });

      expect(result).toStrictEqual({ items: [], skipped: 1 });
    });
  });
});
