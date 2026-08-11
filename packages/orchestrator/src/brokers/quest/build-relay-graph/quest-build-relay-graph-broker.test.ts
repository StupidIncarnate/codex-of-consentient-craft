import {
  FlowNodeStub,
  FlowStub,
  OperationItemStub,
  PackageGraphEntryStub,
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questBuildRelayGraphBroker } from './quest-build-relay-graph-broker';
import { questBuildRelayGraphBrokerProxy } from './quest-build-relay-graph-broker.proxy';
import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';

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
    it('VALID: {feature quest with Chaos-authored codeweaver op} => appends the verify tail, first codeweaver op in_progress with ONE linked work item', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const planOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'chaoswhisperer',
        text: 'Author spec + implementation plan',
        status: 'complete',
      });
      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({ operations: [planOp, codeweaverOp] });
      const priorId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [priorId],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          planOp,
          OperationItemStub({
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            role: 'codeweaver',
            status: 'in_progress',
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000002',
            role: 'flowrider',
            text: 'Flowrider: author the flow-perspective test suites below the browser',
            status: 'pending',
            locked: true,
            flowIds: ['login-flow'],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000003',
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite — flow: login-flow',
            status: 'pending',
            locked: true,
            flowIds: ['login-flow'],
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000004',
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'pending',
            locked: true,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000005',
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'pending',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000006' }),
            role: 'codeweaver',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: ['operations/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
            dependsOn: [priorId],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });
    });

    it('VALID: {feature quest with no pending implementation op} => first actionable is the ward(changed) tail item, work item is command with wardMode', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const planOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'chaoswhisperer',
        text: 'Author spec + implementation plan',
        status: 'complete',
      });
      const quest = QuestStub({ operations: [planOp] });
      const priorId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [priorId],
        now: IsoTimestampStub(),
      });

      expect(result.operations.map(({ id, status }) => ({ id, status }))).toStrictEqual([
        { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', status: 'complete' },
        { id: '00000000-0000-4000-8000-000000000001', status: 'in_progress' },
        { id: '00000000-0000-4000-8000-000000000002', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000003', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000004', status: 'pending' },
        { id: '00000000-0000-4000-8000-000000000005', status: 'pending' },
      ]);
      expect(result.workItems).toStrictEqual([
        WorkItemStub({
          id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000006' }),
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
          dependsOn: [priorId],
          wardMode: 'changed',
          createdAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
    });

    it('VALID: {feature quest with two untagged flows} => ONE whole-quest flowrider item, and ONE siegemaster item PER FLOW so each flow gets its own pt budget and completion gate', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [codeweaverOp],
        flows: [
          FlowStub({ id: 'send-comment', name: 'Send comment' }),
          FlowStub({ id: 'view-comments', name: 'View comments' }),
        ],
      });

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
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
          role: 'blightwarden',
          text: 'Blightwarden: cross-cutting audit across the whole diff',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });

    it('VALID: {feature quest with 2 runtime + 1 operational untagged flow} => flowrider carries ONLY the 2 runtime ids, siegemaster gets one item PER FLOW including the operational one', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [codeweaverOp],
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

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
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
        {
          role: 'blightwarden',
          text: 'Blightwarden: cross-cutting audit across the whole diff',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });

    // The ungated-quest hole: flowrider's `flowIds` is ADVISORY, so an all-operational quest still
    // gets a flowrider item — with an EMPTY list — and the Phase-2 gate derives its own denominator
    // from the quest's runtime flows rather than from this list.
    it('EMPTY: {feature quest whose every flow is operational} => flowrider item exists with EMPTY flowIds, siegemaster still gets one item per operational flow', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [codeweaverOp],
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

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
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
        {
          role: 'blightwarden',
          text: 'Blightwarden: cross-cutting audit across the whole diff',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });

    it("EMPTY: {feature quest with no flows} => flowrider+siegemaster still get ONE item each with empty flowIds, so the off-map `hostile-input` and `perf` probe families — this quest's only security and performance coverage — keep an owner", async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({ operations: [codeweaverOp], flows: [] });

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds }) => ({ role, text, flowIds })),
      ).toStrictEqual([
        {
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
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
        {
          role: 'blightwarden',
          text: 'Blightwarden: cross-cutting audit across the whole diff',
          flowIds: [],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [] },
      ]);
    });
  });

  describe('package-sliced dispatch', () => {
    it('VALID: {tagged nodes across two runtime flows} => one flowrider item per package it owns PLUS a seam item, none for the frontend package, one groundstomper item per e2e-eligible flow, siegemaster unchanged at one per flow', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [codeweaverOp],
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

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(
        result.operations.map(({ role, text, flowIds, packageNames }) => ({
          role,
          text,
          flowIds,
          packageNames,
        })),
      ).toStrictEqual([
        {
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
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
        {
          role: 'blightwarden',
          text: 'Blightwarden: cross-cutting audit across the whole diff',
          flowIds: [],
          packageNames: [],
        },
        { role: 'ward', text: 'Ward gate (full monorepo)', flowIds: [], packageNames: [] },
      ]);
    });

    it('EMPTY: {a runtime flow whose only tagged package is an http-backend} => NO groundstomper item is seeded, because a browser can reach nothing on it', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [codeweaverOp],
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

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result.operations.map(({ role }) => role)).toStrictEqual([
        'codeweaver',
        'ward',
        'flowrider',
        'siegemaster',
        'blightwarden',
        'ward',
      ]);
    });

    it('EMPTY: {a runtime flow whose only tagged package is a frontend-react} => NO flowrider item is seeded, because every unit on it is the browser track’s', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const codeweaverOp = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'codeweaver',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [codeweaverOp],
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

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result.operations.map(({ role }) => role)).toStrictEqual([
        'codeweaver',
        'ward',
        'groundstomper',
        'siegemaster',
        'blightwarden',
        'ward',
      ]);
    });
  });

  describe('codeweaver dependency ordering', () => {
    it('VALID: {codeweaver ops authored top-down with a packageGraph stamped} => the ledger comes back dependencies-first and the LEAF op is the one marked in_progress', async () => {
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

      const result = await questBuildRelayGraphBroker({
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
    it('VALID: {chaoswhisperer op pending + glyphsmith op in_progress} => both forced complete, codeweaver op is the first actionable', async () => {
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

      const result = await questBuildRelayGraphBroker({
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
    it('VALID: {bug-hunt quest, empty operations} => pesteater implementation op in_progress + 3-item verify tail carrying NO groundstomper, first work item is pesteater', async () => {
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

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'pesteater',
            text: 'PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'in_progress',
            locked: true,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000002',
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000003',
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'pending',
            locked: true,
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
            role: 'pesteater',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });
    });
  });

  describe('no actionable operation', () => {
    it('EMPTY: {every op complete after settling, empty relay tail} => operations unchanged, workItems []', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      const completeOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'codeweaver',
        status: 'complete',
      });
      const quest = QuestStub({ operations: [completeOp] });

      proxy.setupEmptyFeatureRelayTail();

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      proxy.restoreFeatureRelayTail();

      expect(result).toStrictEqual({
        operations: [completeOp],
        workItems: [],
      });
    });

    it('VALID: {every op complete after settling, empty relay tail, quest.baseRef unset, HEAD readable} => baseRef is still stamped on the no-work-item early-return path', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupHeadSha({ sha: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1' });
      const completeOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'codeweaver',
        status: 'complete',
      });
      const quest = QuestStub({ operations: [completeOp] });

      proxy.setupEmptyFeatureRelayTail();

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      proxy.restoreFeatureRelayTail();

      expect(result).toStrictEqual({
        operations: [completeOp],
        workItems: [],
        baseRef: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
      });
    });
  });

  describe('baseRef stamping', () => {
    it('VALID: {quest.baseRef unset, HEAD readable} => stamps baseRef from gitHeadShaAdapter, in the same result as the seeded operations + first work item', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });
      proxy.setupHeadSha({ sha: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1' });

      const quest = QuestStub({ questType: 'bug-hunt', operations: [] });

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'pesteater',
            text: 'PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'in_progress',
            locked: true,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000002',
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000003',
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'pending',
            locked: true,
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
            role: 'pesteater',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        baseRef: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
      });
    });

    it('VALID: {quest.baseRef already set} => a re-call (e.g. a re-Start) does NOT overwrite it, even when HEAD resolves to a different sha', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });
      // Staged so the assertion below proves the adapter's answer is never consulted on this path
      // — a broken short-circuit would surface this NEW sha instead of the original.
      proxy.setupHeadSha({ sha: 'b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2' });

      const quest = QuestStub({
        questType: 'bug-hunt',
        operations: [],
        baseRef: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
      });

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result.baseRef).toBe('a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1');
    });

    it('EMPTY: {quest.baseRef unset, HEAD unreadable} => seeding still completes with the full operations ledger + work item, baseRef stays undefined, no throw', async () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });
      proxy.setupHeadShaUnavailable();

      const quest = QuestStub({ questType: 'bug-hunt', operations: [] });

      const result = await questBuildRelayGraphBroker({
        quest,
        priorWorkItemIds: [],
        now: IsoTimestampStub(),
      });

      expect(result).toStrictEqual({
        operations: [
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000001',
            role: 'pesteater',
            text: 'PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'in_progress',
            locked: true,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000002',
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000003',
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'pending',
            locked: true,
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
            role: 'pesteater',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
      });
    });
  });
});
