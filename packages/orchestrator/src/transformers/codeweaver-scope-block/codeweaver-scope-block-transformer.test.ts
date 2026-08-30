import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
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

const SEAM_HEADING =
  'Seams — each line is a node you share with another package, and where that package’s half of it stands:';

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
});
