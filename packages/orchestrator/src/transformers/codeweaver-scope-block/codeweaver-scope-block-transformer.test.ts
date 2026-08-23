import {
  DesignDecisionStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestContractEntryStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { disciplineImplementationStatics } from '../../statics/discipline-implementation/discipline-implementation-statics';
import { codeweaverScopeBlockTransformer } from './codeweaver-scope-block-transformer';

const { plannerMarkdown } = disciplineImplementationStatics;

// THE PACK'S SIDE OF THE `CONTEXT:` HEADING PAIR, parsed off the live `plannerMarkdown` rather than
// copied into a list here — a copy drifts exactly the way the prose drifts, which is the failure
// this pin closes. The section is bounded by its own two `##` headings; inside it the pack numbers
// the headings it tells the planner to look for, and item 4's name is the one its `NOTES` checklist
// tells the planner to QUOTE. `discipline-implementation-statics.test.ts` parses it identically, so
// the two sides cannot disagree about what an enumerated name is.
const CONTEXT_SECTION = plannerMarkdown.slice(
  plannerMarkdown.indexOf('## Your denominator is the `## Context` section of the round document'),
  plannerMarkdown.indexOf('## Cut the cell into CHUNKS'),
);

// The pack lists the headings as a TABLE now, one row each, rather than a numbered list.
const ENUMERATED_CONTEXT_HEADINGS = Array.from(
  CONTEXT_SECTION.matchAll(/^\| `(?<heading>[^`]+)` \|/gmu),
).map((match) => match.groups?.heading ?? '');

const SHARED_ENTRY = QuestPackageEntryStub({
  name: 'shared',
  location: './packages/shared',
  packageType: 'library',
});
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

    it('EMPTY: {a package that tags no node in its flow and owns no contract} => returns no lines at all', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — server: auth-flow',
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
  });

  describe('rendered from the quest at DISPATCH, not baked into the ledger at Start', () => {
    // The regression this transformer exists for. Codeweaver, Flowrider and Siegemaster all hold
    // additive spec authority, so an observable can land on a flow AFTER the operation item that
    // owns that cell was minted. The item below carries only its cell label — no scope text — so an
    // implementation that snapshotted the scope into `text` at Start renders nothing here.
    it('VALID: {an observable added to the flow after the operation item was minted} => the item still renders it verbatim', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — server: auth-flow',
        flowIds: ['auth-flow'],
        packageNames: ['server'],
      });

      const addedMidQuest = FlowObservableStub({
        id: 'rejects-expired-token',
        type: 'api-call',
        description: 'POST /api/session returns 401 for an expired token',
        package: 'server',
        addedBy: 'flowrider',
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
                observables: [addedMidQuest],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Your nodes (rendered from the spec as it stands right now, not from the ledger): #submit-credentials',
        '',
        'Must satisfy — these are YOUR acceptance targets, verbatim:',
        '  - rejects-expired-token [api-call] on #submit-credentials: "POST /api/session returns 401 for an expired token"',
      ]);
    });

    // Same shape, one step further: a node the spec did not have at Start. The ledger holds one
    // (package, flow) key, so a node added to that flow later belongs to this same item.
    it('VALID: {a second node tagged with the item’s package added to the flow later} => both nodes render', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — server: auth-flow',
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
              FlowNodeStub({
                id: 'revoke-session',
                label: 'Revoke session',
                packages: ['server'],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Your nodes (rendered from the spec as it stands right now, not from the ledger): #submit-credentials, #revoke-session',
      ]);
    });
  });

  describe('a flow cell', () => {
    it('VALID: {a server cell with its own observable, contract and design decision} => renders all four blocks and drops everything belonging to the other side', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — server: auth-flow',
        flowIds: ['auth-flow'],
        packageNames: ['server'],
      });

      const quest = QuestStub({
        packagesAffected: [SERVER_ENTRY, WEB_ENTRY],
        designDecisions: [
          DesignDecisionStub({
            id: 'sign-sessions-with-hs256',
            title: 'Sign sessions with HS256',
            rationale: 'verification stays in-process for the single-node deployment',
            relatedNodeIds: ['submit-credentials'],
          }),
          DesignDecisionStub({
            id: 'dashboard-renders-optimistically',
            title: 'Dashboard renders optimistically',
            rationale: 'the redirect must not wait on the first data fetch',
            relatedNodeIds: ['redirect-to-dashboard'],
          }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'session-token',
            name: 'SessionToken',
            kind: 'data',
            status: 'new',
            source: 'packages/server/src/contracts/session-token/session-token-contract.ts',
            nodeId: 'submit-credentials',
            properties: [
              {
                name: 'value',
                type: 'SessionTokenValue',
                description: 'The signed token, opaque to the browser',
              },
            ],
          }),
          // status 'existing' — reference material, never this session's work.
          QuestContractEntryStub({
            id: 'quest-status',
            name: 'QuestStatus',
            kind: 'data',
            status: 'existing',
            source: 'packages/server/src/contracts/quest-status/quest-status-contract.ts',
            nodeId: 'submit-credentials',
          }),
          // Routes to `web` by source, so it is the other cell's contract.
          QuestContractEntryStub({
            id: 'dashboard-props',
            name: 'DashboardProps',
            kind: 'data',
            status: 'new',
            source: 'packages/web/src/contracts/dashboard-props/dashboard-props-contract.ts',
            nodeId: 'redirect-to-dashboard',
          }),
          // Right package, wrong node: anchored outside this cell's nodes.
          QuestContractEntryStub({
            id: 'audit-record',
            name: 'AuditRecord',
            kind: 'data',
            status: 'new',
            source: 'packages/server/src/contracts/audit-record/audit-record-contract.ts',
            nodeId: 'redirect-to-dashboard',
          }),
        ],
        flows: [
          FlowStub({
            id: 'auth-flow',
            name: 'Auth flow',
            nodes: [
              FlowNodeStub({
                id: 'submit-credentials',
                label: 'Submit credentials',
                packages: ['server'],
                observables: [
                  FlowObservableStub({
                    id: 'session-created',
                    type: 'api-call',
                    description: 'POST /api/session returns 201 with a signed token',
                    package: 'server',
                  }),
                ],
              }),
              FlowNodeStub({
                id: 'redirect-to-dashboard',
                label: 'Redirect to dashboard',
                packages: ['web'],
                observables: [
                  FlowObservableStub({
                    id: 'lands-on-dashboard',
                    type: 'ui-state',
                    description: 'the browser lands on /dashboard',
                    package: 'web',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Your nodes (rendered from the spec as it stands right now, not from the ledger): #submit-credentials',
        '',
        'Must satisfy — these are YOUR acceptance targets, verbatim:',
        '  - session-created [api-call] on #submit-credentials: "POST /api/session returns 201 with a signed token"',
        '',
        'Contracts you own — every property description is a requirement:',
        '  - SessionToken (data, new) [packages/server/src/contracts/session-token/session-token-contract.ts]',
        '      value: The signed token, opaque to the browser',
        '',
        'Design decisions constraining your nodes:',
        '  - Sign sessions with HS256 — verification stays in-process for the single-node deployment',
      ]);
    });
  });

  describe('seams', () => {
    // Both halves of a seam are somebody's declared scope, so the useful question is not "is it
    // missing" but "whose is it, and has that session run yet". The ledger answers it: the relay
    // dispatches in order, so a `complete` sibling cell is code on disk right now.
    it('VALID: {a glue node whose other side has a COMPLETE cell} => the line says ALREADY BUILT and asks for verification', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — web: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['web'],
      });
      const serverCell = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — server: warpgate-merge',
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
        'Your nodes (rendered from the spec as it stands right now, not from the ledger): #press-warp',
        '',
        'Must satisfy — these are YOUR acceptance targets, verbatim:',
        '  - warp-button-disables [ui-state] on #press-warp: "the Teleport button goes disabled while the merge runs"',
        '',
        'Seams — each line is a node you share with another package, and where that package’s half of it stands:',
        '  - #press-warp with server — ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not',
        '      attributed to server — merge-route-returns-202: "POST /api/quests/:questId/merge returns 202"',
      ]);
    });

    // The same node from the provider's side. Asking it to "verify web's half exists in committed
    // code" is unsatisfiable — web is a later tier and its session has not run — so the only honest
    // instruction is to leave that half alone and build to the shape it needs.
    it('VALID: {the same glue node read from the side that runs FIRST} => the line says NOT BUILT YET and forbids building the other half', () => {
      const operationItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — server: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['server'],
      });
      const webCell = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — web: warpgate-merge',
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
        'Your nodes (rendered from the spec as it stands right now, not from the ledger): #press-warp',
        '',
        'Must satisfy — these are YOUR acceptance targets, verbatim:',
        '  - merge-route-returns-202 [api-call] on #press-warp: "POST /api/quests/:questId/merge returns 202"',
        '',
        'Seams — each line is a node you share with another package, and where that package’s half of it stands:',
        '  - #press-warp with web — NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs',
        '      attributed to web — warp-button-disables: "the Teleport button goes disabled while the merge runs"',
      ]);
    });

    // The one case where the old blanket "repair it if it does not exist" is still the right
    // instruction: the ledger is derived once at Start, so a node added to the flow mid-quest can
    // tag a package that has no cell on this flow at all. Nobody else will ever build that half.
    it('VALID: {a glue node whose other side has NO cell on this flow} => the line says NO SESSION OWNS IT and hands the half over', () => {
      const operationItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'Codeweaver: build this slice — server: warpgate-merge',
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
                observables: [
                  FlowObservableStub({
                    id: 'warp-button-disables',
                    type: 'ui-state',
                    description: 'the Teleport button goes disabled while the merge runs',
                    package: 'web',
                    addedBy: 'flowrider',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Your nodes (rendered from the spec as it stands right now, not from the ledger): #press-warp',
        '',
        'Seams — each line is a node you share with another package, and where that package’s half of it stands:',
        '  - #press-warp with web — NO SESSION OWNS IT: the ledger holds no codeweaver cell for it on this flow, so this half is yours to build',
        '      attributed to web — warp-button-disables: "the Teleport button goes disabled while the merge runs"',
      ]);
    });

    it('EMPTY: {a node tagging only the item’s own package} => no seam block is rendered', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — server: auth-flow',
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

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Your nodes (rendered from the spec as it stands right now, not from the ledger): #submit-credentials',
      ]);
    });
  });

  describe('a foundation item', () => {
    // `shared` on the quest that motivated this had zero tagged nodes and nine contracts, so
    // contracts route by `source` path and a flow-less item still has a scope to render.
    it('VALID: {flowIds: [] on a shared foundation item} => renders its contracts and no nodes, observables, decisions or seams', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — shared: foundation',
        flowIds: [],
        packageNames: ['shared'],
      });

      const quest = QuestStub({
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
        designDecisions: [
          DesignDecisionStub({
            id: 'dashboard-renders-optimistically',
            title: 'Dashboard renders optimistically',
            rationale: 'the redirect must not wait on the first data fetch',
            relatedNodeIds: ['redirect-to-dashboard'],
          }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'session-token',
            name: 'SessionToken',
            kind: 'data',
            status: 'new',
            source: 'packages/shared/src/contracts/session-token/session-token-contract.ts',
            nodeId: 'redirect-to-dashboard',
            properties: [
              {
                name: 'value',
                type: 'SessionTokenValue',
                description: 'The signed token, opaque to the browser',
              },
            ],
          }),
          QuestContractEntryStub({
            id: 'quest-status',
            name: 'QuestStatus',
            kind: 'data',
            status: 'modified',
            source: 'packages/shared/src/contracts/quest-status/quest-status-contract.ts',
            nodeId: 'redirect-to-dashboard',
            properties: [
              {
                name: 'status',
                type: 'QuestStatusValue',
                description: 'Gains the merging member',
              },
            ],
          }),
          QuestContractEntryStub({
            id: 'archived-shape',
            name: 'ArchivedShape',
            kind: 'data',
            status: 'existing',
            source: 'packages/shared/src/contracts/archived-shape/archived-shape-contract.ts',
            nodeId: 'redirect-to-dashboard',
          }),
          QuestContractEntryStub({
            id: 'dashboard-props',
            name: 'DashboardProps',
            kind: 'data',
            status: 'new',
            source: 'packages/web/src/contracts/dashboard-props/dashboard-props-contract.ts',
            nodeId: 'redirect-to-dashboard',
          }),
        ],
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

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Contracts you own — every property description is a requirement:',
        '  - SessionToken (data, new) [packages/shared/src/contracts/session-token/session-token-contract.ts]',
        '      value: The signed token, opaque to the browser',
        '  - QuestStatus (data, modified) [packages/shared/src/contracts/quest-status/quest-status-contract.ts]',
        '      status: Gains the merging member',
      ]);
    });
  });

  describe('a contract that spans packages', () => {
    // A contract's `source` is one-to-one; a contract is one-to-many. This one is anchored in
    // shared and two of its properties name files that live in web. Routing the whole contract by
    // its own path alone hands every property to shared, and the web deliverables — which no
    // observable anywhere carries — reach no session at all.
    it('VALID: {a property declaring its own source in another package} => the web foundation item renders that contract and only the properties that land in web', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — web: foundation',
        flowIds: [],
        packageNames: ['web'],
      });

      const quest = QuestStub({
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
        contracts: [
          QuestContractEntryStub({
            id: 'status-keyed-statics-fanout',
            name: 'StatusKeyedStaticsFanout',
            kind: 'data',
            status: 'modified',
            source: 'packages/shared/src/statics/quest-hydrate-strategy/hydrate-statics.ts',
            nodeId: 'warpgate-row',
            properties: [
              {
                name: 'questHydrateStrategyStatics.strategies',
                type: 'HydrateStrategyMap',
                description: 'Both new statuses need an entry or the key-set equality test fails',
              },
              {
                name: 'questGateSectionsStatics.sections',
                type: 'GateSectionMap',
                description: 'Sixteen literal keys read by index with a QuestStatus',
                source:
                  'packages/web/src/statics/quest-gate-sections/quest-gate-sections-statics.ts',
              },
              {
                name: 'questStatusColorsStatics.status',
                type: 'StatusColorMap',
                description: 'A sixteen-status colour map guarded by a full-value test',
                source:
                  'packages/web/src/statics/quest-status-colors/quest-status-colors-statics.ts',
              },
            ],
          }),
        ],
        flows: [],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Contracts you own — every property description is a requirement:',
        '  - StatusKeyedStaticsFanout (data, modified) [packages/shared/src/statics/quest-hydrate-strategy/hydrate-statics.ts]',
        '      questGateSectionsStatics.sections [packages/web/src/statics/quest-gate-sections/quest-gate-sections-statics.ts]: Sixteen literal keys read by index with a QuestStatus',
        '      questStatusColorsStatics.status [packages/web/src/statics/quest-status-colors/quest-status-colors-statics.ts]: A sixteen-status colour map guarded by a full-value test',
      ]);
    });

    it("VALID: {the same contract read from the package its own source names} => it renders only the properties that fall back to the contract's file", () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — shared: foundation',
        flowIds: [],
        packageNames: ['shared'],
      });

      const quest = QuestStub({
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
        contracts: [
          QuestContractEntryStub({
            id: 'status-keyed-statics-fanout',
            name: 'StatusKeyedStaticsFanout',
            kind: 'data',
            status: 'modified',
            source: 'packages/shared/src/statics/quest-hydrate-strategy/hydrate-statics.ts',
            nodeId: 'warpgate-row',
            properties: [
              {
                name: 'questHydrateStrategyStatics.strategies',
                type: 'HydrateStrategyMap',
                description: 'Both new statuses need an entry or the key-set equality test fails',
              },
              {
                name: 'questGateSectionsStatics.sections',
                type: 'GateSectionMap',
                description: 'Sixteen literal keys read by index with a QuestStatus',
                source:
                  'packages/web/src/statics/quest-gate-sections/quest-gate-sections-statics.ts',
              },
            ],
          }),
        ],
        flows: [],
      });

      expect(codeweaverScopeBlockTransformer({ quest, operationItem }).map(String)).toStrictEqual([
        '',
        'Contracts you own — every property description is a requirement:',
        '  - StatusKeyedStaticsFanout (data, modified) [packages/shared/src/statics/quest-hydrate-strategy/hydrate-statics.ts]',
        '      questHydrateStrategyStatics.strategies: Both new statuses need an entry or the key-set equality test fails',
      ]);
    });
  });

  // CROSS-FILE PAIR — this transformer ←→ `disciplineImplementationStatics.plannerMarkdown`. What
  // this transformer splices into the `CONTEXT:` section of a codeweaver operator's prompt is the
  // planner's WHOLE denominator: the pack tells it "no checklist tool answers it", enumerates the
  // headings this file emits so the planner can find its acceptance targets inside a block its
  // parent pasted in whole, and its chunk-`NOTES` checklist depends on item 4 — `Design decisions
  // constraining your nodes` — by name, telling the planner to quote that text rather than call
  // `get-quest` for it.
  //
  // The pin lives on THIS side because it is the only side that can hold both halves live:
  // `folderConfigStatics.statics.allowedImports` is `['statics/']`, so a test under `statics/`
  // cannot import a transformer at all, while a test under `transformers/` may import statics.
  //
  // What breaks if they diverge: nothing. Silently. An added, dropped, renamed or reordered heading
  // leaves the pack's enumeration stale, the planner hunts for a heading nothing renders, finds no
  // acceptance targets under it, and plans the cell against the ledger's label — the one source the
  // pack's own authority order puts LAST. An audit already caught this once, with the pack listing
  // four while this file emitted five, and the missing one was precisely the heading the `NOTES`
  // checklist told the planner to quote.
  describe('the CONTEXT: headings the implementation pack enumerates', () => {
    it('VALID: {a cell exercising all five sections} => every heading it emits is opened by the enumerated name at that position', () => {
      const operationItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'Codeweaver: build this slice — server: warpgate-merge',
        status: 'in_progress',
        flowIds: ['warpgate-merge'],
        packageNames: ['server'],
      });

      // One glue node carrying a server observable, a server-sourced contract and a design decision
      // is enough to open all five sections, so every heading below is one this transformer really
      // emitted rather than one assumed to exist.
      const quest = QuestStub({
        packagesAffected: [SERVER_ENTRY, WEB_ENTRY],
        operations: [operationItem],
        designDecisions: [
          DesignDecisionStub({
            id: 'sign-sessions-with-hs256',
            title: 'Sign sessions with HS256',
            rationale: 'verification stays in-process for the single-node deployment',
            relatedNodeIds: ['press-warp'],
          }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'session-token',
            name: 'SessionToken',
            kind: 'data',
            status: 'new',
            source: 'packages/server/src/contracts/session-token/session-token-contract.ts',
            nodeId: 'press-warp',
            properties: [
              {
                name: 'value',
                type: 'SessionTokenValue',
                description: 'The signed token, opaque to the browser',
              },
            ],
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press warp',
                packages: ['server', 'web'],
                observables: [
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

      // A heading is a rendered line starting in column zero — which is neither the blank separator
      // pushed before it nor any of the indented detail lines pushed under it. Harvested from the
      // real output, never listed here.
      const emittedHeadings = codeweaverScopeBlockTransformer({ quest, operationItem })
        .map(String)
        .filter((line) => /^\S/u.test(line));

      // Positional match, so a renamed heading, a reordered pair and a sixth section all come out
      // false rather than passing on set membership.
      expect({
        emittedCount: emittedHeadings.length,
        enumeratedCount: ENUMERATED_CONTEXT_HEADINGS.length,
        eachEnumeratedNameOpensTheHeadingAtThatPosition: emittedHeadings.map((heading, index) =>
          heading.startsWith(String(ENUMERATED_CONTEXT_HEADINGS[index])),
        ),
      }).toStrictEqual({
        emittedCount: 5,
        enumeratedCount: 5,
        eachEnumeratedNameOpensTheHeadingAtThatPosition: [true, true, true, true, true],
      });
    });
  });
});
