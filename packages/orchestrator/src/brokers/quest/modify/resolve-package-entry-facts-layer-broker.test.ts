import { QuestPackageEntryStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';

import { resolvePackageEntryFactsLayerBroker } from './resolve-package-entry-facts-layer-broker';
import { resolvePackageEntryFactsLayerBrokerProxy } from './resolve-package-entry-facts-layer-broker.proxy';

// A repo that is deliberately NOT the one these tests run inside: every absolute address the setups
// describe hangs off it, so an implementation anchored on the process cwd reaches none of them.
const PROJECT_ROOT = RepoRootCwdStub({ value: '/home/testuser/projects/assayer' });

describe('resolvePackageEntryFactsLayerBroker', () => {
  describe('existingLocations', () => {
    it('EMPTY: {entries: []} => returns an empty set and an empty map', async () => {
      resolvePackageEntryFactsLayerBrokerProxy();

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts).toStrictEqual({
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>(),
        stampedEntries: [],
      });
    });

    it("VALID: {location present only under the quest's own project root} => resolves, because the existence check is anchored there and not on the process cwd", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      // The ONLY address fs.access answers true for. A cwd-anchored resolve would probe
      // '<cwd>/packages/core' instead, which answers false, and the set would come back empty.
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/core' });
      const editEntry = QuestPackageEntryStub({
        name: 'core',
        location: './packages/core',
        changeType: 'edit',
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [editEntry],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.existingLocations).toStrictEqual(new Set<unknown>(['./packages/core']));
    });

    it('VALID: {one location on disk, one absent} => only the one on disk lands in the set', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/web' });
      const editEntry = QuestPackageEntryStub({
        name: 'web',
        location: './packages/web',
        changeType: 'edit',
      });
      const newEntry = QuestPackageEntryStub({
        name: 'groundstomp',
        location: './packages/groundstomp',
        changeType: 'new',
        usedBy: ['orchestrator'],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [editEntry, newEntry],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts).toStrictEqual({
        existingLocations: new Set<unknown>(['./packages/web']),
        dependentsByPackage: new Map<unknown, unknown[]>(),
        stampedEntries: [editEntry, newEntry],
      });
    });

    it("EDGE: {edit entry whose location is absent under the quest's project root} => stays out of the set, so the violations transformer can name it", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      // Present under a DIFFERENT repo's root, which this quest does not target.
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/other/packages/core' });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'core',
            location: './packages/core',
            changeType: 'edit',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.existingLocations).toStrictEqual(new Set<unknown>());
    });

    it("EDGE: {new entry whose location already exists under the quest's project root} => lands in the set, so the violations transformer can refuse it", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/core' });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'core',
            location: './packages/core',
            changeType: 'new',
            usedBy: ['app'],
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.existingLocations).toStrictEqual(new Set<unknown>(['./packages/core']));
    });
  });

  describe('packageType stamping', () => {
    it("VALID: {edit entry declaring 'library' over a widgets+react root} => the detector wins and stamps frontend-react", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/web' });
      proxy.setupDetectedPackage({
        packageRoot: '/home/testuser/projects/assayer/packages/web',
        srcDirNames: ['widgets', 'bindings'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            changeType: 'edit',
            packageType: 'library',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.stampedEntries).toStrictEqual([
        {
          name: 'web',
          location: './packages/web',
          changeType: 'edit',
          packageType: 'frontend-react',
        },
      ]);
    });

    it("VALID: {edit entry whose shape only sits under the quest's project root} => the detector is anchored there, so the stamp is that repo's answer", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/core' });
      // The detector's readdir/readFile only answer for THIS absolute root; a cwd-anchored
      // packageRoot reads an empty shape and classifies 'library' instead.
      proxy.setupDetectedPackage({
        packageRoot: '/home/testuser/projects/assayer/packages/core',
        srcDirNames: ['adapters'],
        adapterDirNames: ['hono'],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'core',
            location: './packages/core',
            changeType: 'edit',
            packageType: 'library',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.stampedEntries).toStrictEqual([
        {
          name: 'core',
          location: './packages/core',
          changeType: 'edit',
          packageType: 'http-backend',
        },
      ]);
    });

    it('VALID: {delete entry over an mcp-server root} => the detector stamps the entry it is about to remove', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/mcp' });
      proxy.setupDetectedPackage({
        packageRoot: '/home/testuser/projects/assayer/packages/mcp',
        srcDirNames: ['adapters'],
        adapterDirNames: ['@modelcontextprotocol'],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'mcp',
            location: './packages/mcp',
            changeType: 'delete',
            packageType: 'library',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.stampedEntries).toStrictEqual([
        {
          name: 'mcp',
          location: './packages/mcp',
          changeType: 'delete',
          packageType: 'mcp-server',
        },
      ]);
    });

    it("VALID: {new entry declaring 'frontend-react'} => keeps the declared type, nothing on disk to detect", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupDetectedPackage({
        packageRoot: '/home/testuser/projects/assayer/packages/groundstomp',
        srcDirNames: ['brokers'],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'groundstomp',
            location: './packages/groundstomp',
            changeType: 'new',
            packageType: 'frontend-react',
            usedBy: ['orchestrator'],
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.stampedEntries).toStrictEqual([
        {
          name: 'groundstomp',
          location: './packages/groundstomp',
          changeType: 'new',
          packageType: 'frontend-react',
          usedBy: ['orchestrator'],
        },
      ]);
    });

    it('VALID: {edit entry whose location is absent} => no detection runs and the declared type stands', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupDetectedPackage({
        packageRoot: '/home/testuser/projects/assayer/packages/gone',
        srcDirNames: ['widgets'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'gone',
            location: './packages/gone',
            changeType: 'edit',
            packageType: 'cli-tool',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.stampedEntries).toStrictEqual([
        {
          name: 'gone',
          location: './packages/gone',
          changeType: 'edit',
          packageType: 'cli-tool',
        },
      ]);
    });

    it('ERROR: {root whose own package.json is not valid JSON} => no stamp rather than a failed write', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/broken' });
      proxy.setupUndetectablePackage({
        packageRoot: '/home/testuser/projects/assayer/packages/broken',
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'broken',
            location: './packages/broken',
            changeType: 'edit',
            packageType: 'http-backend',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.stampedEntries).toStrictEqual([
        {
          name: 'broken',
          location: './packages/broken',
          changeType: 'edit',
          packageType: 'http-backend',
        },
      ]);
    });

    it('VALID: {two entries naming one location} => both are stamped from a single detection', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/web' });
      proxy.setupDetectedPackage({
        packageRoot: '/home/testuser/projects/assayer/packages/web',
        srcDirNames: ['widgets'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            changeType: 'edit',
            packageType: 'library',
          }),
          QuestPackageEntryStub({
            name: 'web-alias',
            location: './packages/web',
            changeType: 'edit',
            packageType: 'cli-tool',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.stampedEntries).toStrictEqual([
        {
          name: 'web',
          location: './packages/web',
          changeType: 'edit',
          packageType: 'frontend-react',
        },
        {
          name: 'web-alias',
          location: './packages/web',
          changeType: 'edit',
          packageType: 'frontend-react',
        },
      ]);
    });
  });

  describe('dependent scan', () => {
    it("VALID: {a delete entry, siblings importing it} => maps the deleted package to its dependents' directory names", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      proxy.setupWorkspace({
        root: '/home/testuser/projects/assayer/packages',
        packages: [
          { dirName: 'shared', manifest: { name: '@dm/shared' } },
          {
            dirName: 'cli',
            manifest: { name: '@dm/cli', dependencies: { '@dm/shared': '*' } },
          },
          {
            dirName: 'server',
            manifest: { name: '@dm/server', devDependencies: { '@dm/shared': '*' } },
          },
        ],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(
        new Map<unknown, unknown[]>([['shared', ['cli', 'server']]]),
      );
    });

    it("VALID: {a delete entry whose workspace only exists under the quest's project root} => the sibling scan reads that repo's directory, not a same-named one elsewhere", async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      // A same-named workspace under a DIFFERENT repo root, listing a dependent that must never
      // appear in the result. Only the quest-root-anchored listing below may be read.
      proxy.setupWorkspace({
        root: '/home/testuser/projects/other/packages',
        packages: [
          { dirName: 'shared', manifest: { name: '@dm/shared' } },
          {
            dirName: 'stranger',
            manifest: { name: '@dm/stranger', dependencies: { '@dm/shared': '*' } },
          },
        ],
      });
      proxy.setupWorkspace({
        root: '/home/testuser/projects/assayer/packages',
        packages: [
          { dirName: 'shared', manifest: { name: '@dm/shared' } },
          { dirName: 'app', manifest: { name: '@dm/app', dependencies: { '@dm/shared': '*' } } },
        ],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(
        new Map<unknown, unknown[]>([['shared', ['app']]]),
      );
    });

    it('VALID: {no delete entry} => the scan never runs and the map stays empty', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'edit',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(new Map<unknown, unknown[]>());
    });

    it('VALID: {a package depending on itself by name} => the self edge is dropped', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      proxy.setupWorkspace({
        root: '/home/testuser/projects/assayer/packages',
        packages: [
          {
            dirName: 'shared',
            manifest: { name: '@dm/shared', peerDependencies: { '@dm/shared': '*' } },
          },
        ],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(new Map<unknown, unknown[]>());
    });

    it('VALID: {a dependency name no sibling manifest claims} => contributes no edge', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      proxy.setupWorkspace({
        root: '/home/testuser/projects/assayer/packages',
        packages: [
          { dirName: 'shared', manifest: { name: '@dm/shared' } },
          { dirName: 'cli', manifest: { name: '@dm/cli', dependencies: { zod: '^3' } } },
        ],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(new Map<unknown, unknown[]>());
    });

    it('VALID: {a sibling manifest carrying no name} => is skipped as a dependency target', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      proxy.setupWorkspace({
        root: '/home/testuser/projects/assayer/packages',
        packages: [
          { dirName: 'shared', manifest: {} },
          { dirName: 'cli', manifest: { name: '@dm/cli', dependencies: { '@dm/shared': '*' } } },
        ],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(new Map<unknown, unknown[]>());
    });

    it('ERROR: {workspace root is not readable} => contributes no siblings and the write is not failed on it', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      proxy.setupUnreadableRoot({ root: '/home/testuser/projects/assayer/packages' });
      proxy.setupDetectedPackage({
        packageRoot: '/home/testuser/projects/assayer/packages/shared',
        srcDirNames: ['contracts'],
      });
      const deleteEntry = QuestPackageEntryStub({
        name: 'shared',
        location: './packages/shared',
        changeType: 'delete',
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [deleteEntry],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts).toStrictEqual({
        existingLocations: new Set<unknown>(['./packages/shared']),
        dependentsByPackage: new Map<unknown, unknown[]>(),
        stampedEntries: [deleteEntry],
      });
    });

    it('ERROR: {a sibling with no readable package.json} => is skipped, the readable ones still count', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      proxy.setupWorkspace({
        root: '/home/testuser/projects/assayer/packages',
        packages: [
          { dirName: 'shared', manifest: { name: '@dm/shared' } },
          { dirName: 'cli', manifest: { name: '@dm/cli', dependencies: { '@dm/shared': '*' } } },
          { dirName: 'docs' },
        ],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(
        new Map<unknown, unknown[]>([['shared', ['cli']]]),
      );
    });

    it('ERROR: {a sibling whose package.json is not valid JSON} => is skipped rather than failing the write', async () => {
      const proxy = resolvePackageEntryFactsLayerBrokerProxy();
      proxy.setupLocationExists({ packageRoot: '/home/testuser/projects/assayer/packages/shared' });
      proxy.setupWorkspace({
        root: '/home/testuser/projects/assayer/packages',
        packages: [
          { dirName: 'shared', manifest: { name: '@dm/shared' } },
          { dirName: 'cli', manifest: { name: '@dm/cli', dependencies: { '@dm/shared': '*' } } },
          { dirName: 'broken', raw: '{ not json' },
        ],
      });

      const facts = await resolvePackageEntryFactsLayerBroker({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        projectRoot: PROJECT_ROOT,
      });

      expect(facts.dependentsByPackage).toStrictEqual(
        new Map<unknown, unknown[]>([['shared', ['cli']]]),
      );
    });
  });
});
