import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  PackageGraphEntryStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { codeweaverScopeBlockTransformer } from './codeweaver-scope-block-transformer';

const SERVER_ENTRY = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  packageType: 'http-backend',
});
const WEB_ENTRY = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  packageType: 'frontend-react',
});
const SHARED_ENTRY = QuestPackageEntryStub({
  name: 'shared',
  location: './packages/shared',
  packageType: 'library',
});

const SEAM_HEADING =
  'Seams — each line is a node you share with another package, and where that package’s half of it stands:';
const SHARED_HOME_HEADING =
  'Shared homes — the library-kind packages this quest declares. Code your package and another BOTH need moves into one of these, rather than being copied into yours or reached across for:';

// A cell whose package tags no node anywhere, so nothing but the shared-home block can render for
// it. Every shared-home case below reuses it, which is also what proves the two blocks are
// independent — a seam is not a precondition for naming a home.
const WEB_CELL = OperationItemStub({
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  text: 'Codeweaver: build this slice — package: web · flow: auth-flow',
  status: 'in_progress',
  flowIds: ['auth-flow'],
  packageNames: ['web'],
});

describe('codeweaverScopeBlockTransformer', () => {
  describe('nothing to scope', () => {
    it('EMPTY: {operation item declaring no package} => returns no lines at all', () => {
      const quest = QuestStub();
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice',
        packageNames: [],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem })).toStrictEqual([]);
    });

    it('EMPTY: {a package that tags no node in its flow} => returns no lines at all', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — package: server · flow: auth-flow',
        flowIds: ['auth-flow'],
        packageNames: ['server'],
      });
      const quest = QuestStub({
        packagesAffected: [SERVER_ENTRY, WEB_ENTRY],
        contracts: [],
        flows: [
          FlowStub({
            id: 'auth-flow',
            name: 'Auth flow',
            nodes: [
              FlowNodeStub({
                id: 'redirect-to-dashboard',
                label: 'Redirect to dashboard',
                packages: ['web'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem })).toStrictEqual([]);
    });

    it('EMPTY: {a node tagging only the item’s own package} => no seam block is rendered', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — package: server · flow: auth-flow',
        flowIds: ['auth-flow'],
        packageNames: ['server'],
      });
      const quest = QuestStub({
        packagesAffected: [SERVER_ENTRY],
        contracts: [],
        flows: [
          FlowStub({
            id: 'auth-flow',
            name: 'Auth flow',
            nodes: [
              FlowNodeStub({
                id: 'submit-credentials',
                label: 'Submit credentials',
                packages: ['server'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem })).toStrictEqual([]);
    });

    // A package whose whole scope is contracts tags no node anywhere, so it shares no seam. Its
    // contracts reach it through `get-quest({ questId, packageName })`, not through this block.
    it('EMPTY: {flowIds: [] on a contracts-only package item} => returns no lines at all', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — package: shared',
        flowIds: [],
        packageNames: ['shared'],
      });
      const quest = QuestStub({
        packagesAffected: [SERVER_ENTRY, WEB_ENTRY],
        contracts: [],
        flows: [
          FlowStub({
            id: 'auth-flow',
            name: 'Auth flow',
            nodes: [
              FlowNodeStub({
                id: 'redirect-to-dashboard',
                label: 'Redirect to dashboard',
                packages: ['web'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem })).toStrictEqual([]);
    });
  });

  describe('seams', () => {
    // Both halves of a seam are somebody's declared scope, so the useful question is not "is it
    // missing" but "whose is it, and has that session run yet". The ledger answers it, and NOTHING
    // else does — which is why this block survives while the rest of the scope moved into the flow
    // slice `get-quest({ questId, flowId, packageName })` returns.
    it('VALID: {a glue node whose other side has a COMPLETE cell} => the line says ALREADY BUILT and asks for verification', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — package: web · flow: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['web'],
      });
      const serverCell = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — package: server · flow: warpgate-merge',
        status: 'complete',
        flowIds: ['warpgate-merge'],
        packageNames: ['server'],
      });

      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
        contracts: [],
        operations: [serverCell, operationItem],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press warp',
                packages: ['web', 'server'],
                observables: [
                  FlowObservableStub({
                    id: 'warp-button-disables',
                    type: 'ui-state',
                    description: 'the Teleport button goes disabled while the merge runs',
                    package: 'web',
                  }),
                  FlowObservableStub({
                    id: 'merge-route-returns-202',
                    type: 'api-call',
                    description: 'POST /api/quests/:questId/merge returns 202',
                    package: 'server',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        SEAM_HEADING,
        '  - #press-warp with server — ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not',
      ]);
    });

    // The same node from the provider's side. Asking it to "verify web's half exists in committed
    // code" is unsatisfiable — web is a later tier and its session has not run — so the only honest
    // instruction is to leave that half alone and build to the shape it needs.
    it('VALID: {the same glue node read from the side that runs FIRST} => the line says NOT BUILT YET and forbids building the other half', () => {
      const operationItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — package: server · flow: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['server'],
      });
      const webCell = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — package: web · flow: warpgate-merge',
        status: 'pending',
        flowIds: ['warpgate-merge'],
        packageNames: ['web'],
      });

      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
        contracts: [],
        operations: [operationItem, webCell],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press warp',
                packages: ['web', 'server'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        SEAM_HEADING,
        '  - #press-warp with web — NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs',
      ]);
    });

    // The ledger is derived once at Start, so a node added to the flow mid-quest can tag a package
    // that has no cell on this flow at all. Nobody else will ever build that half.
    it('VALID: {a glue node whose other side has NO cell on this flow} => the line says NO SESSION OWNS IT and hands the half over', () => {
      const operationItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — package: server · flow: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['server'],
      });

      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
        contracts: [],
        operations: [operationItem],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press warp',
                packages: ['web', 'server'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        SEAM_HEADING,
        '  - #press-warp with web — NO SESSION OWNS IT: the ledger holds no codeweaver cell for it on this flow, so this half is yours to build',
      ]);
    });

    // Rendered from the quest AT DISPATCH, never baked into the ledger at Start: the item below
    // carries only its cell label, so an implementation that snapshotted the scope into `text`
    // renders nothing for a node added to the flow afterwards.
    it('VALID: {a glue node added to the flow after the item was minted} => its seam line still renders', () => {
      const operationItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — package: server · flow: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['server'],
      });

      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
        contracts: [],
        operations: [operationItem],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press warp',
                packages: ['server'],
              }),
              FlowNodeStub({
                id: 'stream-merge-log',
                label: 'Stream the merge log',
                packages: ['server', 'web'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        SEAM_HEADING,
        '  - #stream-merge-log with web — NO SESSION OWNS IT: the ledger holds no codeweaver cell for it on this flow, so this half is yours to build',
      ]);
    });

    // The FLOW narrows the sibling match: a sibling item that does not carry this flow does not
    // render this node in its own scope either, so it genuinely owns no half here.
    it('VALID: {a sibling cell for the other package on a DIFFERENT flow} => the line still says NO SESSION OWNS IT', () => {
      const operationItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — package: server · flow: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['server'],
      });
      const webCellOnAnotherFlow = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — package: web · flow: auth-flow',
        status: 'pending',
        flowIds: ['auth-flow'],
        packageNames: ['web'],
      });

      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
        contracts: [],
        operations: [operationItem, webCellOnAnotherFlow],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press warp',
                packages: ['web', 'server'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        SEAM_HEADING,
        '  - #press-warp with web — NO SESSION OWNS IT: the ledger holds no codeweaver cell for it on this flow, so this half is yours to build',
      ]);
    });
  });

  describe('shared homes', () => {
    const WEB_ONLY_FLOW = FlowStub({
      id: 'auth-flow',
      name: 'Auth flow',
      nodes: [
        FlowNodeStub({
          id: 'redirect-to-dashboard',
          label: 'Redirect to dashboard',
          packages: ['web'],
        }),
      ],
    });

    // The cell is told to stay in one package. The move it needs when a change reaches for behaviour
    // in a sibling is "put it where both can call it", and the only place the package with that
    // property is NAMED is the quest — no prompt can hold it, because every repo picks its own name.
    it('VALID: {a declared library package the item’s own package already depends on} => names it as a home and says the dependency is already there', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY, SHARED_ENTRY],
        packageGraph: [
          PackageGraphEntryStub({ id: 'shared', dependsOn: [], depth: 0, packageType: 'library' }),
          PackageGraphEntryStub({
            id: 'web',
            dependsOn: ['shared'],
            depth: 1,
            packageType: 'frontend-react',
          }),
        ],
        contracts: [],
        operations: [WEB_CELL],
        flows: [WEB_ONLY_FLOW],
      });

      expect(
        codeweaverScopeBlockTransformer({ quest, operationItem: WEB_CELL }).map(String),
      ).toStrictEqual(['', SHARED_HOME_HEADING, '  - shared — web already depends on it']);
    });

    // Without the edge the move is a file, an import AND a package.json change, and a session that
    // does not know that ships an import the root node_modules resolves and a standalone install
    // does not.
    it('VALID: {a declared library package nothing links the item’s package to} => says the move adds the dependency too', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SHARED_ENTRY],
        packageGraph: [
          PackageGraphEntryStub({ id: 'shared', dependsOn: [], depth: 0, packageType: 'library' }),
          PackageGraphEntryStub({
            id: 'web',
            dependsOn: [],
            depth: 0,
            packageType: 'frontend-react',
          }),
        ],
        contracts: [],
        operations: [WEB_CELL],
        flows: [WEB_ONLY_FLOW],
      });

      expect(
        codeweaverScopeBlockTransformer({ quest, operationItem: WEB_CELL }).map(String),
      ).toStrictEqual([
        '',
        SHARED_HOME_HEADING,
        '  - shared — web does not depend on it yet, so the move adds that dependency too',
      ]);
    });

    // `packageType` is the detector's FIRST match and a package can honestly be more than one, so a
    // shared library that also fronts something would be dropped by the single winning label.
    it('VALID: {a package whose winning kind is not library but whose kind SET holds it} => still renders as a home', () => {
      const fronted = QuestPackageEntryStub({
        name: 'core',
        location: './packages/core',
        packageType: 'programmatic-service',
        packageTypes: ['programmatic-service', 'library'],
      });
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, fronted],
        packageGraph: [],
        contracts: [],
        operations: [WEB_CELL],
        flows: [WEB_ONLY_FLOW],
      });

      expect(
        codeweaverScopeBlockTransformer({ quest, operationItem: WEB_CELL }).map(String),
      ).toStrictEqual([
        '',
        SHARED_HOME_HEADING,
        '  - core — web does not depend on it yet, so the move adds that dependency too',
      ]);
    });

    // A home the package already reaches costs a file and an import; one it does not costs a
    // manifest edit as well. The cheaper move is read first, so it is listed first.
    it('VALID: {two library homes, one already depended on} => the reachable one is listed first and the rest by name', () => {
      const kit = QuestPackageEntryStub({
        name: 'kit',
        location: './packages/kit',
        packageType: 'library',
      });
      const atoms = QuestPackageEntryStub({
        name: 'atoms',
        location: './packages/atoms',
        packageType: 'library',
      });
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, kit, atoms, SHARED_ENTRY],
        packageGraph: [
          PackageGraphEntryStub({
            id: 'web',
            dependsOn: ['shared'],
            depth: 1,
            packageType: 'frontend-react',
          }),
        ],
        contracts: [],
        operations: [WEB_CELL],
        flows: [WEB_ONLY_FLOW],
      });

      expect(
        codeweaverScopeBlockTransformer({ quest, operationItem: WEB_CELL }).map(String),
      ).toStrictEqual([
        '',
        SHARED_HOME_HEADING,
        '  - shared — web already depends on it',
        '  - atoms — web does not depend on it yet, so the move adds that dependency too',
        '  - kit — web does not depend on it yet, so the move adds that dependency too',
      ]);
    });

    // Both blocks answer questions only the quest holds, and neither is a precondition for the
    // other — a glue node says whose half is whose, a home says where code that has to MOVE goes.
    it('VALID: {an item with both a seam and a home} => the seam block renders first, then the homes', () => {
      const serverCell = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — package: server · flow: auth-flow',
        status: 'complete',
        flowIds: ['auth-flow'],
        packageNames: ['server'],
      });
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY, SHARED_ENTRY],
        packageGraph: [
          PackageGraphEntryStub({
            id: 'web',
            dependsOn: ['shared'],
            depth: 1,
            packageType: 'frontend-react',
          }),
        ],
        contracts: [],
        operations: [serverCell, WEB_CELL],
        flows: [
          FlowStub({
            id: 'auth-flow',
            name: 'Auth flow',
            nodes: [
              FlowNodeStub({
                id: 'submit-credentials',
                label: 'Submit credentials',
                packages: ['web', 'server'],
              }),
            ],
          }),
        ],
      });

      expect(
        codeweaverScopeBlockTransformer({ quest, operationItem: WEB_CELL }).map(String),
      ).toStrictEqual([
        '',
        SEAM_HEADING,
        '  - #submit-credentials with server — ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not',
        '',
        SHARED_HOME_HEADING,
        '  - shared — web already depends on it',
      ]);
    });

    // Its own package is where its work already lands, so naming it as somewhere to move code to
    // says nothing — and it is the reachable-first sort's loudest wrong answer if it leaks through.
    it('EMPTY: {the only library package IS the item’s own} => no shared-home block is rendered', () => {
      const sharedCell = OperationItemStub({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        text: 'Codeweaver: build this slice — package: shared',
        status: 'in_progress',
        flowIds: [],
        packageNames: ['shared'],
      });
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SHARED_ENTRY],
        packageGraph: [],
        contracts: [],
        operations: [sharedCell],
        flows: [WEB_ONLY_FLOW],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem: sharedCell })).toStrictEqual(
        [],
      );
    });

    // A package the quest DELETES is gone once this lands, so nothing may be moved into it.
    it('EMPTY: {the only library package is one the quest deletes} => no shared-home block is rendered', () => {
      const doomed = QuestPackageEntryStub({
        name: 'legacy-shared',
        location: './packages/legacy-shared',
        packageType: 'library',
        changeType: 'delete',
      });
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, doomed],
        packageGraph: [],
        contracts: [],
        operations: [WEB_CELL],
        flows: [WEB_ONLY_FLOW],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem: WEB_CELL })).toStrictEqual([]);
    });

    // The degenerate case: a quest that declares nothing but application packages. The block is
    // omitted rather than rendered empty, and the codeweaver prompt is what tells the session to go
    // find the repo's own shared package and declare it.
    it('EMPTY: {no declared package of any library kind} => no shared-home block is rendered', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
        packageGraph: [],
        contracts: [],
        operations: [WEB_CELL],
        flows: [WEB_ONLY_FLOW],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem: WEB_CELL })).toStrictEqual([]);
    });
  });
});
