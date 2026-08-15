import {
  FlowNodeStub,
  FlowStub,
  OperationItemStub,
  PackageGraphEntryStub,
  QuestContractEntryStub,
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { questBuildRelayGraphBroker } from './quest-build-relay-graph-broker';
import { questBuildRelayGraphBrokerProxy } from './quest-build-relay-graph-broker.proxy';
import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';

type QuestTypeKey = keyof typeof questTypeRegistryStatics;

const QUEST_TYPES = Object.keys(questTypeRegistryStatics) as readonly QuestTypeKey[];

const UUIDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000007',
  '00000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000009',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
] as const;

const WEB_PACKAGE = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  changeType: 'edit',
  packageType: 'frontend-react',
});
const SERVER_PACKAGE = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  changeType: 'edit',
  packageType: 'http-backend',
});
const CLI_PACKAGE = QuestPackageEntryStub({
  name: 'cli',
  location: './packages/cli',
  changeType: 'edit',
  packageType: 'cli-tool',
});

describe('questBuildRelayGraphBroker', () => {
  describe('feature quest', () => {
    it('VALID: {feature quest with no packagesAffected/flow tags/contracts} => riftcarver is first actionable, the derived codeweaver fallback item seeds pending behind it, and the verify tail is ward → flowrider → siegemaster → ward with no blightwarden entry', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub();
      const priorId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [priorId],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
            status: 'in_progress',
            locked: true,
            packageNames: [],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000002',
            text: 'Codeweaver: build this slice',
            status: 'pending',
            locked: false,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000003',
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000004',
            role: 'flowrider',
            text: 'Flowrider: author the flow-perspective test suites below the browser',
            status: 'pending',
            locked: true,
            flowIds: ['login-flow'],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000005',
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite — flow: login-flow',
            status: 'pending',
            locked: true,
            flowIds: ['login-flow'],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000006',
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'pending',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000007' }),
            role: 'riftcarver',
            status: 'pending',
            spawnerType: 'command',
            relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
            dependsOn: [priorId],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });
    });

    it('VALID: {feature quest with two untagged flows, no packagesAffected} => the derived codeweaver item is the whole-quest fallback, flowrider gets ONE whole-quest item, and siegemaster gets one item PER FLOW so each flow gets its own pt budget and completion gate', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'send-comment', name: 'Send comment' }),
          FlowStub({ id: 'view-comments', name: 'View comments' }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'riftcarver',
          text: 'Riftcarver: carve the quest branch, worktree and preflight build',
          flowIds: [],
        },
        {
          role: 'codeweaver',
          text: 'Codeweaver: build this slice',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (changed files)', flowIds: [] },
        {
          role: 'flowrider',
          text: 'Flowrider: author the flow-perspective test suites below the browser',
          flowIds: ['send-comment', 'view-comments'],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: send-comment',
          flowIds: ['send-comment'],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: view-comments',
          flowIds: ['view-comments'],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });

    it('VALID: {feature quest with 2 runtime + 1 operational untagged flow} => flowrider carries ONLY the 2 runtime ids, siegemaster gets one item PER FLOW including the operational one', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'send-comment', name: 'Send comment', flowType: 'runtime' }),
          FlowStub({ id: 'view-comments', name: 'View comments', flowType: 'runtime' }),
          FlowStub({
            id: 'register-lint-rule',
            name: 'Register lint rule',
            flowType: 'operational',
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'riftcarver',
          text: 'Riftcarver: carve the quest branch, worktree and preflight build',
          flowIds: [],
        },
        {
          role: 'codeweaver',
          text: 'Codeweaver: build this slice',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (changed files)', flowIds: [] },
        {
          role: 'flowrider',
          text: 'Flowrider: author the flow-perspective test suites below the browser',
          flowIds: ['send-comment', 'view-comments'],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: send-comment',
          flowIds: ['send-comment'],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: view-comments',
          flowIds: ['view-comments'],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: register-lint-rule',
          flowIds: ['register-lint-rule'],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });

    // The ungated-quest hole: flowrider's `flowIds` is ADVISORY, so an all-operational quest still
    // gets a flowrider item — with an EMPTY list — and the Phase-2 gate derives its own denominator
    // from the quest's runtime flows rather than from this list.
    it('EMPTY: {feature quest whose every flow is operational} => flowrider item exists with EMPTY flowIds, siegemaster still gets one item per operational flow', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'register-lint-rule',
            name: 'Register lint rule',
            flowType: 'operational',
          }),
          FlowStub({
            id: 'sweep-legacy-imports',
            name: 'Sweep legacy imports',
            flowType: 'operational',
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'riftcarver',
          text: 'Riftcarver: carve the quest branch, worktree and preflight build',
          flowIds: [],
        },
        {
          role: 'codeweaver',
          text: 'Codeweaver: build this slice',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (changed files)', flowIds: [] },
        {
          role: 'flowrider',
          text: 'Flowrider: author the flow-perspective test suites below the browser',
          flowIds: [],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: register-lint-rule',
          flowIds: ['register-lint-rule'],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: sweep-legacy-imports',
          flowIds: ['sweep-legacy-imports'],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });

    it("EMPTY: {feature quest with no flows} => flowrider+siegemaster still get ONE item each with empty flowIds, so the off-map `hostile-input` and `perf` probe families — this quest's only security and performance coverage — keep an owner", () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({ flows: [] });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'riftcarver',
          text: 'Riftcarver: carve the quest branch, worktree and preflight build',
          flowIds: [],
        },
        {
          role: 'codeweaver',
          text: 'Codeweaver: build this slice',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (changed files)', flowIds: [] },
        {
          role: 'flowrider',
          text: 'Flowrider: author the flow-perspective test suites below the browser',
          flowIds: [],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });
  });

  describe('derived codeweaver implementation ops', () => {
    it('VALID: {two packages each tagged by one node in one flow, plus a foundation contract} => one codeweaver item per (package, flow) cell plus one foundation item, package-tier ranked with the foundation item ahead of its package’s flow cell', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE],
        contracts: [
          QuestContractEntryStub({
            id: 'session-token',
            name: 'SessionToken',
            status: 'new',
            source: 'packages/server/src/contracts/session-token/session-token-contract.ts',
          }),
        ],
        flows: [
          FlowStub({
            id: 'auth-flow',
            name: 'Auth flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'submit-credentials',
                label: 'Submit credentials',
                packages: ['server'],
              }),
              FlowNodeStub({
                id: 'redirect-to-dashboard',
                label: 'Redirect to dashboard',
                packages: ['web'],
              }),
            ],
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations
          .filter((operation) => operation.role === 'codeweaver')
          .map(({ text, status, locked, flowIds, packageNames }) => ({
            text,
            status,
            locked,
            flowIds,
            packageNames,
          })),
      ).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — server: foundation',
          status: 'pending',
          locked: false,
          flowIds: [],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — server: auth-flow',
          status: 'pending',
          locked: false,
          flowIds: ['auth-flow'],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — web: auth-flow',
          status: 'pending',
          locked: false,
          flowIds: ['auth-flow'],
          packageNames: ['web'],
        },
      ]);
    });

    it('VALID: {one package tagged by a node on each of two flows} => the same package gets one codeweaver item per flow, ordered by flow declaration order', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'flow-a',
            name: 'Flow A',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'step-a', label: 'Step A', packages: ['server'] })],
          }),
          FlowStub({
            id: 'flow-b',
            name: 'Flow B',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'step-b', label: 'Step B', packages: ['server'] })],
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations
          .filter((operation) => operation.role === 'codeweaver')
          .map(({ text, flowIds, packageNames }) => ({ text, flowIds, packageNames })),
      ).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — server: flow-a',
          flowIds: ['flow-a'],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — server: flow-b',
          flowIds: ['flow-b'],
          packageNames: ['server'],
        },
      ]);
    });
  });

  describe('package-sliced dispatch', () => {
    it('VALID: {tagged nodes across two runtime flows} => one flowrider item per package it owns PLUS a seam item, none for the frontend package, one groundstomper item per e2e-eligible flow, siegemaster unchanged at one per flow', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE, CLI_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'persist', label: 'Persist', packages: ['server'] }),
              FlowNodeStub({ id: 'press-warp', label: 'Press warp', packages: ['web', 'server'] }),
            ],
          }),
          FlowStub({
            id: 'sweep-rows',
            name: 'Sweep rows',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'batch', label: 'Batch', packages: ['cli'] }),
              FlowNodeStub({ id: 'relay', label: 'Relay', packages: ['server', 'cli'] }),
            ],
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      // codeweaver items are the derived-implementation-ops concern (see the describe block above);
      // filtered out here so this test stays scoped to flowrider/groundstomper/siegemaster fan-out.
      expect(
        result.operations
          .filter((operation) => operation.role !== 'codeweaver')
          .map(({ role, text, flowIds, packageNames }) => ({
            role,
            text,
            flowIds,
            packageNames,
          })),
      ).toStrictEqual([
        {
          role: 'riftcarver',
          text: 'Riftcarver: carve the quest branch, worktree and preflight build',
          flowIds: [],
          packageNames: [],
        },
        { role: 'ward', text: 'Ward gate (changed files)', flowIds: [], packageNames: [] },
        {
          role: 'flowrider',
          text: 'Flowrider: author the flow-perspective test suites below the browser — package: server',
          flowIds: ['send-comment'],
          packageNames: ['server'],
        },
        {
          role: 'flowrider',
          text: 'Flowrider: author the flow-perspective test suites below the browser — package: cli',
          flowIds: ['sweep-rows'],
          packageNames: ['cli'],
        },
        {
          role: 'flowrider',
          text: 'Flowrider: author the flow-perspective test suites below the browser — seam: server + cli',
          flowIds: ['sweep-rows'],
          packageNames: ['server', 'cli'],
        },
        {
          role: 'groundstomper',
          text: 'Groundstomper: author the browser walk for this flow — flow: send-comment',
          flowIds: ['send-comment'],
          packageNames: ['web'],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: send-comment',
          flowIds: ['send-comment'],
          packageNames: [],
        },
        {
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: sweep-rows',
          flowIds: ['sweep-rows'],
          packageNames: [],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [], packageNames: [] },
      ]);
    });

    it('EMPTY: {a runtime flow whose only tagged package is an http-backend} => NO groundstomper item is seeded, because a browser can reach nothing on it', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'sweep-rows',
            name: 'Sweep rows',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'batch', label: 'Batch', packages: ['server'] })],
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations
          .filter((operation) => operation.role !== 'codeweaver')
          .map(({ role }) => role),
      ).toStrictEqual(['riftcarver', 'ward', 'flowrider', 'siegemaster', 'ward']);
    });

    it('EMPTY: {a runtime flow whose only tagged package is a frontend-react} => NO flowrider item is seeded, because every unit on it is the browser track’s', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] })],
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations
          .filter((operation) => operation.role !== 'codeweaver')
          .map(({ role }) => role),
      ).toStrictEqual(['riftcarver', 'ward', 'groundstomper', 'siegemaster', 'ward']);
    });
  });

  describe('codeweaver dependency ordering', () => {
    it('VALID: {codeweaver ops authored top-down with a packageGraph stamped} => the ledger comes back dependencies-first and the LEAF op is the one marked in_progress', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const webOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'codeweaver',
        text: 'web: render the comment box',
        status: 'pending',
        packageNames: ['web'],
      });
      const serverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        text: 'server: expose the comment route',
        status: 'pending',
        packageNames: ['server'],
      });
      const quest = QuestStub({
        operations: [webOp, serverOp],
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE],
        packageGraph: [
          PackageGraphEntryStub({
            id: 'server',
            dependsOn: [],
            depth: 0,
            packageType: 'http-backend',
            changeType: 'edit',
          }),
          PackageGraphEntryStub({
            id: 'web',
            dependsOn: ['server'],
            depth: 1,
            packageType: 'frontend-react',
            changeType: 'edit',
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.slice(0, 2).map(({ id, text, status }) => ({ id, text, status })),
      ).toStrictEqual([
        {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          text: 'server: expose the comment route',
          status: 'in_progress',
        },
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          text: 'web: render the comment box',
          status: 'pending',
        },
      ]);
      expect(result.workItems.map(({ relatedDataItems }) => relatedDataItems)).toStrictEqual([
        ['operations/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
      ]);
    });
  });

  describe('intake plan items forced complete', () => {
    it('VALID: {chaoswhisperer op pending + glyphsmith op in_progress} => both forced complete, codeweaver op is the first actionable', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const forgottenPlanOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'chaoswhisperer',
        text: 'Author spec + implementation plan',
        status: 'pending',
      });
      const forgottenDesignOp = OperationItemStub({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        role: 'glyphsmith',
        text: 'Design prototypes',
        status: 'in_progress',
      });
      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [forgottenPlanOp, forgottenDesignOp, codeweaverOp],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result.operations.map(({ id, status }) => ({ id, status }))).toStrictEqual([
        { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', status: 'complete' },
        { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', status: 'complete' },
        { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', status: 'in_progress' },
        { id: '00000000-0000-4000-8000-000000000001', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000002', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000003', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000004', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000005', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000006', status: 'pending' },
      ]);
      expect(
        result.workItems.map(({ role, relatedDataItems }) => ({ role, relatedDataItems })),
      ).toStrictEqual([
        {
          role: 'codeweaver',
          relatedDataItems: ['operations/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
        },
      ]);
    });
  });

  describe('bug-hunt quest', () => {
    it('VALID: {bug-hunt quest, empty operations} => riftcarver is first actionable and its work item is a command spawner; pesteater seeds pending carrying the node tags, ahead of the 2-item verify tail', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        questType: 'bug-hunt',
        operations: [],
        packagesAffected: [WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'repro-crash',
            name: 'Repro crash',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] })],
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
            status: 'in_progress',
            locked: true,
            packageNames: [],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000002',
            role: 'pesteater',
            text: 'PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'pending',
            locked: true,
            packageNames: ['web'],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000003',
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000004',
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'pending',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000005' }),
            role: 'riftcarver',
            status: 'pending',
            spawnerType: 'command',
            relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });
    });

    it('VALID: {node tags spread across two flows, one package repeated} => the seeded pesteater item carries the UNION of the node tags, first-tagged order, once each', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        questType: 'bug-hunt',
        operations: [],
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE, CLI_PACKAGE],
        flows: [
          FlowStub({
            id: 'repro-crash',
            name: 'Repro crash',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'persist', label: 'Persist', packages: ['web', 'server'] }),
            ],
          }),
          FlowStub({
            id: 'expected-behaviour',
            name: 'Expected behaviour',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'invoke', label: 'Invoke', packages: ['cli', 'web'] })],
          }),
        ],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, packageNames }) => ({ role, packageNames })),
      ).toStrictEqual([
        { role: 'riftcarver', packageNames: [] },
        { role: 'pesteater', packageNames: ['web', 'server', 'cli'] },
        { role: 'ward', packageNames: [] },
        { role: 'ward', packageNames: [] },
      ]);
    });

    it('EMPTY: {bug-hunt quest with no flows to tag} => the pesteater item still seeds, declaring no packages', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        questType: 'bug-hunt',
        operations: [],
        packagesAffected: [],
        flows: [],
      });

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, status, packageNames }) => ({
          role,
          status,
          packageNames,
        })),
      ).toStrictEqual([
        { role: 'riftcarver', status: 'in_progress', packageNames: [] },
        { role: 'pesteater', status: 'pending', packageNames: [] },
        { role: 'ward', status: 'pending', packageNames: [] },
        { role: 'ward', status: 'pending', packageNames: [] },
      ]);
    });
  });

  describe('empty relay tail', () => {
    it('VALID: {every prior op complete, empty relay tail} => riftcarver seeds first and becomes the sole actionable operation, with the derived codeweaver item still seeded pending behind it', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });
      const completeOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'codeweaver',
        status: 'complete',
      });
      const quest = QuestStub({ operations: [completeOp] });

      proxy.setupEmptyFeatureRelayTail();

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      proxy.restoreFeatureRelayTail();

      expect(result).toStrictEqual({
        operations: [
          completeOp,
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
            status: 'in_progress',
            locked: true,
            packageNames: [],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000002',
            text: 'Codeweaver: build this slice',
            status: 'pending',
            locked: false,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000003' }),
            role: 'riftcarver',
            status: 'pending',
            spawnerType: 'command',
            relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });
    });
  });

  describe('no actionable operation', () => {
    // The defensive branch. Emptying the relay tail alone no longer reaches it: both quest types
    // seed at least one pending implementation item, so the derived codeweaver item would still be
    // actionable. With BOTH seed sources empty and every prior op complete there is nothing pending
    // at all, and the broker returns the ledger with NO work item rather than minting one for
    // undefined.
    it('EMPTY: {every prior op complete, empty relay tail AND empty startImplementationOps} => returns the ledger unchanged with no work item', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });
      const completeOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'codeweaver',
        status: 'complete',
      });
      const quest = QuestStub({ operations: [completeOp] });

      proxy.setupEmptyFeatureRelayTail();
      proxy.setupEmptyFeatureStartImplementationOps();

      const result = questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      proxy.restoreFeatureStartImplementationOps();
      proxy.restoreFeatureRelayTail();

      expect(result).toStrictEqual({ operations: [completeOp], workItems: [] });
    });
  });

  describe('riftcarver seeded first', () => {
    // Riftcarver is prepended to `startImplementationOps` for BOTH quest types (see
    // quest-type-registry-statics), so this holds however the rest of the seed differs — the same
    // body proves it for each one. It runs BEFORE any worktree exists, which is exactly why it
    // carries no baseRef and no package scope: `packageNames` narrows an AGENT's search, and a
    // command dispatcher has no prompt to narrow.
    it.each(QUEST_TYPES)(
      'VALID: {%s quest, Start Quest seed} => riftcarver is the first operation item, locked, scoped to no packages, and its work item is a command spawner',
      (questType) => {
        const proxy = questBuildRelayGraphBrokerProxy();
        proxy.setupUuids({ ids: UUIDS });

        const quest = QuestStub({ questType, operations: [] });

        const result = questBuildRelayGraphBroker({
          quest,
          priorWorkItemIds: [],
          now: IsoTimestampStub(),
        });

        expect(result.operations[0]).toStrictEqual(
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
            status: 'in_progress',
            locked: true,
            packageNames: [],
          }),
        );
        // The work item's own uuid is minted AFTER every operation item, one uuid per item, off
        // the SAME fixed UUIDS queue staged above — so it is always the queue entry sitting right
        // after however many operation items this quest type seeded, however many that turns out
        // to be for feature vs bug-hunt.
        expect(result.workItems).toStrictEqual([
          WorkItemStub({
            id: QuestWorkItemIdStub({
              value: String(UUIDS[result.operations.length]),
            }),
            role: 'riftcarver',
            status: 'pending',
            spawnerType: 'command',
            relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      },
    );
  });
});
