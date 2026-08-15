import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestContractEntryStub,
  QuestContractPropertyStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { questSaveInvariantsTransformer } from './quest-save-invariants-transformer';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const QUEST_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

describe('questSaveInvariantsTransformer', () => {
  it('VALID: {default empty quest} => returns empty array', () => {
    const quest = QuestStub();

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([]);
  });

  it('INVALID: {two flows share id} => returns only the failed Flow ID Uniqueness check', () => {
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
    });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([
      {
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'Duplicate flow ids: login-flow',
      },
    ]);
  });

  it('INVALID: {two flows share id AND a contract uses a raw primitive} => returns both failed invariants in check order', () => {
    const rawProperty = QuestContractPropertyStub({ name: 'password' as never });
    const node = FlowNodeStub({ id: 'anchor-node' as never });
    const edge = FlowEdgeStub({
      id: 'self' as never,
      from: 'anchor-node' as never,
      to: 'anchor-node' as never,
    });
    const contract = QuestContractEntryStub({
      name: 'Creds' as never,
      nodeId: 'anchor-node' as never,
    });
    const quest = QuestStub({
      flows: [
        FlowStub({ id: 'contract-flow' as never, nodes: [node], edges: [edge] }),
        FlowStub({ id: 'login-flow' as never }),
        FlowStub({ id: 'login-flow' as never }),
      ],
      contracts: [contract],
    });
    // Bypass Zod's parse-time ban on raw 'string' to test the post-parse guard path.
    Object.assign(rawProperty, { type: 'string' });
    Object.assign(contract, { properties: [rawProperty] });
    Object.assign(quest.contracts[0] as object, { properties: [rawProperty] });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([
      {
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'Duplicate flow ids: login-flow',
      },
      {
        name: 'No Raw Primitives in Contracts',
        passed: false,
        details:
          "Raw primitive contract properties: contract 'Creds' property 'password' uses raw primitive 'string'",
      },
    ]);
  });

  it('VALID: {quest without violations, status params provided} => returns empty array', () => {
    const quest = QuestStub();

    const failures = questSaveInvariantsTransformer({
      quest,
      currentStatus: 'approved',
      nextStatus: 'in_progress',
    });

    expect(failures).toStrictEqual([]);
  });

  it.each(QUEST_STATUSES)(
    'VALID: {currentStatus and nextStatus both %s, quest with an invariant violation} => still returns the same invariants failure (the structural tier ignores status)',
    (status) => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: status,
        nextStatus: status,
      });

      expect(failures).toStrictEqual([
        {
          name: 'Flow ID Uniqueness',
          passed: false,
          details: 'Duplicate flow ids: login-flow',
        },
      ]);
    },
  );

  describe('package-relational rules at the flows_approved gate', () => {
    it('INVALID: {-> flows_approved, node tags a package absent from packagesAffected} => returns a named Node Package Coverage check', () => {
      const quest = QuestStub({
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [FlowNodeStub({ id: 'press-warp', packages: ['cli'] })],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: 'review_flows',
        nextStatus: 'flows_approved',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Node Package Coverage',
          passed: false,
          details:
            "Node 'press-warp' in flow 'warpgate-merge' tags package 'cli', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.",
        },
      ]);
    });

    it('INVALID: {-> flows_approved, seam edge whose endpoints share no package} => returns a named No Unglued Seam check', () => {
      const quest = QuestStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web' }),
          QuestPackageEntryStub({ name: 'server', location: './packages/server' }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [
              FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
              FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] }),
            ],
            edges: [
              FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' }),
            ],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: 'review_flows',
        nextStatus: 'flows_approved',
      });

      expect(failures).toStrictEqual([
        {
          name: 'No Unglued Seam',
          passed: false,
          details:
            "Edge 'press-to-status' in flow 'warpgate-merge' joins node 'press-warp' (packages: web) to node 'merge-status-ok' (packages: server), which share no package. An edge whose endpoints share no package is a boundary crossed with nothing spanning it — widen one endpoint to carry both packages (that endpoint IS the glue node), or insert a node between them that does.",
        },
      ]);
    });

    it('VALID: {no status transition, same unglued quest} => the seam rules do not bind on an ordinary write', () => {
      const quest = QuestStub({
        packagesAffected: [],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [
              FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
              FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] }),
            ],
            edges: [
              FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' }),
            ],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({ quest, currentStatus: 'explore_flows' });

      expect(failures).toStrictEqual([]);
    });
  });

  describe('package-relational rules at the approved gate', () => {
    it('INVALID: {-> approved, glue node whose observables cover one side only} => returns a named Observable Package Attribution check', () => {
      const quest = QuestStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web' }),
          QuestPackageEntryStub({ name: 'server', location: './packages/server' }),
        ],
        operations: [OperationItemStub({ role: 'codeweaver', packageNames: ['web', 'server'] })],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [
              FlowNodeStub({
                id: 'landed-on-base',
                packages: ['web', 'server'],
                observables: [
                  FlowObservableStub({
                    id: 'merge-banner-shown',
                    package: 'web',
                    type: 'ui-state',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: 'review_observables',
        nextStatus: 'approved',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Observable Package Attribution',
          passed: false,
          details:
            "Node 'landed-on-base' in flow 'warpgate-merge' tags packages web, server but its observables only cover web. Package(s) server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
        },
      ]);
    });

    it('INVALID: {-> approved, feature quest whose contract source sits under no declared package} => returns a named Contract Source Coverage check', () => {
      const quest = QuestStub({
        questType: 'feature',
        packagesAffected: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web' }),
          QuestPackageEntryStub({ name: 'server', location: './packages/server' }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'merge-status',
            name: 'MergeStatus',
            status: 'new',
            source: 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts',
            nodeId: 'merge-status-ok',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [
              FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
              FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] }),
            ],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: 'review_observables',
        nextStatus: 'approved',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Contract Source Coverage',
          passed: false,
          details:
            "Contract 'MergeStatus' declares source 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
        },
      ]);
    });

    it("VALID: {-> approved, feature quest whose contract is status 'existing'} => reference material is never refused", () => {
      const quest = QuestStub({
        questType: 'feature',
        packagesAffected: [
          QuestPackageEntryStub({ name: 'server', location: './packages/server' }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'merge-status',
            name: 'MergeStatus',
            status: 'existing',
            source: 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts',
            nodeId: 'merge-status-ok',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] })],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: 'review_observables',
        nextStatus: 'approved',
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {-> approved, bug-hunt quest whose contract source resolves nowhere} => the contract-source rule is scoped to feature quests', () => {
      const quest = QuestStub({
        questType: 'bug-hunt',
        packagesAffected: [
          QuestPackageEntryStub({ name: 'server', location: './packages/server' }),
        ],
        operations: [],
        contracts: [
          QuestContractEntryStub({
            id: 'merge-status',
            name: 'MergeStatus',
            status: 'new',
            source: 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts',
            nodeId: 'merge-status-ok',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] })],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: 'review_observables',
        nextStatus: 'approved',
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {-> approved, ledger covers the spine and every observable is attributed} => returns empty array', () => {
      const quest = QuestStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web' }),
          QuestPackageEntryStub({ name: 'server', location: './packages/server' }),
        ],
        operations: [OperationItemStub({ role: 'codeweaver', packageNames: ['web', 'server'] })],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                packages: ['web'],
                observables: [FlowObservableStub({ id: 'warp-button-disables', package: 'web' })],
              }),
              FlowNodeStub({ id: 'merge-status-ok', type: 'decision', packages: ['server'] }),
            ],
          }),
        ],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: 'review_observables',
        nextStatus: 'approved',
      });

      expect(failures).toStrictEqual([]);
    });
  });
});
