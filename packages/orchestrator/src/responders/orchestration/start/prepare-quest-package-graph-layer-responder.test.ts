import {
  PackageGraphEntryStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { PrepareQuestPackageGraphLayerResponder } from './prepare-quest-package-graph-layer-responder';
import { PrepareQuestPackageGraphLayerResponderProxy } from './prepare-quest-package-graph-layer-responder.proxy';

const SHARED_ENTRY = QuestPackageEntryStub({
  name: 'shared',
  location: './packages/shared',
  changeType: 'edit',
  packageType: 'library',
});
const SERVER_ENTRY = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  changeType: 'edit',
  packageType: 'http-backend',
});
const CLI_ENTRY = QuestPackageEntryStub({
  name: 'cli',
  location: './packages/cli',
  changeType: 'edit',
  packageType: 'cli-tool',
});

describe('PrepareQuestPackageGraphLayerResponder', () => {
  describe('derived layering', () => {
    it('VALID: {shared <- server <- cli} => one entry per declared package, depth 0 at the leaf and rising with each dependent', async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({
        location: './packages/shared',
        packageJson: { name: '@dm/shared' },
      });
      proxy.setupManifest({
        location: './packages/server',
        packageJson: { name: '@dm/server', dependencies: { '@dm/shared': '*' } },
      });
      proxy.setupManifest({
        location: './packages/cli',
        packageJson: { name: '@dm/cli', dependencies: { '@dm/server': '*' } },
      });
      const quest = QuestStub({ packagesAffected: [SHARED_ENTRY, SERVER_ENTRY, CLI_ENTRY] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'shared',
          dependsOn: [],
          depth: 0,
          packageType: 'library',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: ['shared'],
          depth: 1,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'cli',
          dependsOn: ['server'],
          depth: 2,
          packageType: 'cli-tool',
          changeType: 'edit',
        }),
      ]);
    });

    it('VALID: {a devDependency edge} => counted the same as a runtime one, so a dev-only consumer is no leaf', async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({
        location: './packages/shared',
        packageJson: { name: '@dm/shared', devDependencies: { '@dm/server': '*' } },
      });
      proxy.setupManifest({ location: './packages/server', packageJson: { name: '@dm/server' } });
      const quest = QuestStub({ packagesAffected: [SHARED_ENTRY, SERVER_ENTRY] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'shared',
          dependsOn: ['server'],
          depth: 1,
          packageType: 'library',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: [],
          depth: 0,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
      ]);
    });

    it("VALID: {a dependency on a package the quest does not declare} => no edge, because the graph carries only the quest's own nodes", async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({
        location: './packages/shared',
        packageJson: { name: '@dm/shared', dependencies: { zod: '^3.0.0' } },
      });
      const quest = QuestStub({ packagesAffected: [SHARED_ENTRY] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'shared',
          dependsOn: [],
          depth: 0,
          packageType: 'library',
          changeType: 'edit',
        }),
      ]);
    });

    it('EDGE: {a manifest listing itself} => no self-edge, which would make the package its own dependency', async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({
        location: './packages/shared',
        packageJson: { name: '@dm/shared', devDependencies: { '@dm/shared': '*' } },
      });
      const quest = QuestStub({ packagesAffected: [SHARED_ENTRY] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'shared',
          dependsOn: [],
          depth: 0,
          packageType: 'library',
          changeType: 'edit',
        }),
      ]);
    });

    it('EDGE: {a manifest with no name field} => nothing can point at it, so its would-be dependents stay leaves', async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({ location: './packages/server', packageJson: {} });
      proxy.setupManifest({
        location: './packages/cli',
        packageJson: { name: '@dm/cli', dependencies: { '@dm/server': '*' } },
      });
      const quest = QuestStub({ packagesAffected: [SERVER_ENTRY, CLI_ENTRY] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: [],
          depth: 0,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'cli',
          dependsOn: [],
          depth: 0,
          packageType: 'cli-tool',
          changeType: 'edit',
        }),
      ]);
    });

    it('EDGE: {a dependency cycle between two declared packages} => every depth stays 0, so Start still seeds rather than refusing over a workspace ward owns', async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({
        location: './packages/shared',
        packageJson: { name: '@dm/shared', dependencies: { '@dm/server': '*' } },
      });
      proxy.setupManifest({
        location: './packages/server',
        packageJson: { name: '@dm/server', dependencies: { '@dm/shared': '*' } },
      });
      const quest = QuestStub({ packagesAffected: [SHARED_ENTRY, SERVER_ENTRY] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'shared',
          dependsOn: ['server'],
          depth: 0,
          packageType: 'library',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: ['shared'],
          depth: 0,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
      ]);
    });

    it('ERROR: {an unreadable manifest} => that package contributes no edges and Start still gets a graph', async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({ location: './packages/shared', packageJson: { name: '@dm/shared' } });
      proxy.setupManifestUnreadable({ location: './packages/server' });
      const quest = QuestStub({ packagesAffected: [SHARED_ENTRY, SERVER_ENTRY] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'shared',
          dependsOn: [],
          depth: 0,
          packageType: 'library',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: [],
          depth: 0,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
      ]);
    });
  });

  describe('this workspace, derived from its own manifests', () => {
    it("VALID: {every packages/* manifest on disk, read verbatim} => each package's depth is the layer its real dependencies put it in", async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      const packagesAffected = proxy.setupRealWorkspaceManifests();
      const quest = QuestStub({ packagesAffected });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      // Nothing below is transcribed: the adjacency comes from the manifests on disk, the depths
      // from the same pass Start runs, and `depth` is the sole input to the codeweaver dispatch
      // order — so a dependency added to any package.json moves a number here instead of passing
      // unseen. The six layers it spells out, alphabetical by directory name:
      //   L0 testing / L1 shared / L2 config, eslint-plugin, hooks, tooling, ward, web
      //   L3 local-eslint, orchestrator / L4 mcp, server / L5 cli
      // `shared` is L1 rather than a leaf because its `@dungeonmaster/testing` devDependency is a
      // real edge — packageJsonDependencyNamesTransformer unions all three dependency fields.
      expect(result?.map((entry) => `${String(entry.id)}=${String(entry.depth)}`)).toStrictEqual([
        'cli=5',
        'config=2',
        'eslint-plugin=2',
        'hooks=2',
        'local-eslint=3',
        'mcp=4',
        'orchestrator=3',
        'server=4',
        'shared=1',
        'testing=0',
        'tooling=2',
        'ward=2',
        'web=2',
      ]);
    });
  });

  describe('post-quest state', () => {
    it("VALID: {a 'new' package with usedBy} => the node is added and its consumer gains the reverse edge, without any manifest of its own", async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({ location: './packages/server', packageJson: { name: '@dm/server' } });
      const designSystem = QuestPackageEntryStub({
        name: 'design-system',
        location: './packages/design-system',
        changeType: 'new',
        packageType: 'library',
        usedBy: ['server'],
      });
      const quest = QuestStub({ packagesAffected: [SERVER_ENTRY, designSystem] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: ['design-system'],
          depth: 1,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'design-system',
          dependsOn: [],
          depth: 0,
          packageType: 'library',
          changeType: 'new',
        }),
      ]);
    });

    it("VALID: {a 'new' package whose usedBy names a package the quest never declared} => the reverse edge is dropped, since there is no node to hang it on", async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({ location: './packages/server', packageJson: { name: '@dm/server' } });
      const designSystem = QuestPackageEntryStub({
        name: 'design-system',
        location: './packages/design-system',
        changeType: 'new',
        packageType: 'library',
        usedBy: ['web'],
      });
      const quest = QuestStub({ packagesAffected: [SERVER_ENTRY, designSystem] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: [],
          depth: 0,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
        PackageGraphEntryStub({
          id: 'design-system',
          dependsOn: [],
          depth: 0,
          packageType: 'library',
          changeType: 'new',
        }),
      ]);
    });

    it("VALID: {a 'delete' package a survivor still imports} => the node is gone and so is the edge into it", async () => {
      const proxy = PrepareQuestPackageGraphLayerResponderProxy();
      proxy.setupManifest({
        location: './packages/server',
        packageJson: { name: '@dm/server', dependencies: { '@dm/legacy': '*' } },
      });
      const legacy = QuestPackageEntryStub({
        name: 'legacy',
        location: './packages/legacy',
        changeType: 'delete',
        packageType: 'library',
      });
      const quest = QuestStub({ packagesAffected: [SERVER_ENTRY, legacy] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toStrictEqual([
        PackageGraphEntryStub({
          id: 'server',
          dependsOn: [],
          depth: 0,
          packageType: 'http-backend',
          changeType: 'edit',
        }),
      ]);
    });
  });

  describe('stamped once', () => {
    it('VALID: {quest already carrying a packageGraph} => returns undefined, so a re-Start never recomputes it', async () => {
      PrepareQuestPackageGraphLayerResponderProxy();
      const quest = QuestStub({
        packagesAffected: [SHARED_ENTRY, SERVER_ENTRY],
        packageGraph: [
          PackageGraphEntryStub({
            id: 'shared',
            dependsOn: [],
            depth: 0,
            packageType: 'library',
            changeType: 'edit',
          }),
        ],
      });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {quest declaring no packages} => returns undefined rather than an empty graph to persist', async () => {
      PrepareQuestPackageGraphLayerResponderProxy();
      const quest = QuestStub({ packagesAffected: [] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toBe(undefined);
    });

    it("EMPTY: {every declared package is a 'delete'} => returns undefined, because the post-quest graph has no node left", async () => {
      PrepareQuestPackageGraphLayerResponderProxy();
      const legacy = QuestPackageEntryStub({
        name: 'legacy',
        location: './packages/legacy',
        changeType: 'delete',
        packageType: 'library',
      });
      const quest = QuestStub({ packagesAffected: [legacy] });

      const result = await PrepareQuestPackageGraphLayerResponder({ quest });

      expect(result).toBe(undefined);
    });
  });
});
