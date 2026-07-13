import {
  OperationItemStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questBuildRelayGraphBroker } from './quest-build-relay-graph-broker';
import { questBuildRelayGraphBrokerProxy } from './quest-build-relay-graph-broker.proxy';
import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';

describe('questBuildRelayGraphBroker', () => {
  describe('feature quest', () => {
    it('VALID: {feature quest with Chaos-authored codeweaver op} => appends 6-item verify tail, first codeweaver op in_progress with ONE linked work item', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({
        ids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
          '00000000-0000-4000-8000-000000000006',
          '00000000-0000-4000-8000-000000000007',
        ],
      });

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

      const result = questBuildRelayGraphBroker({
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
            text: 'Flowrider: author the flow-perspective test suite over every quest flow',
            status: 'pending',
            locked: true,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000003',
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA every quest flow and review the flow test suite',
            status: 'pending',
            locked: true,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000004',
            role: 'lawbringer',
            text: 'Lawbringer: standards review across the whole quest diff',
            status: 'pending',
            locked: true,
          }),
          OperationItemStub({
            id: '00000000-0000-4000-8000-000000000005',
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'pending',
            locked: true,
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

    it('VALID: {feature quest with no pending implementation op} => first actionable is the ward(changed) tail item, work item is command with wardMode', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({
        ids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
          '00000000-0000-4000-8000-000000000006',
          '00000000-0000-4000-8000-000000000007',
        ],
      });

      const planOp = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'chaoswhisperer',
        text: 'Author spec + implementation plan',
        status: 'complete',
      });
      const quest = QuestStub({ operations: [planOp] });
      const priorId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      const result = questBuildRelayGraphBroker({
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
        { id: '00000000-0000-4000-8000-000000000006', status: 'pending' },
      ]);
      expect(result.workItems).toStrictEqual([
        WorkItemStub({
          id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-000000000007' }),
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
  });

  describe('intake plan items forced complete', () => {
    it('VALID: {chaoswhisperer op pending + glyphsmith op in_progress} => both forced complete, codeweaver op is the first actionable', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({
        ids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
          '00000000-0000-4000-8000-000000000006',
          '00000000-0000-4000-8000-000000000007',
        ],
      });

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
    it('VALID: {bug-hunt quest, empty operations} => pesteater implementation op in_progress + 4-item verify tail, first work item is pesteater', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
      proxy.setupUuids({
        ids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
          '00000000-0000-4000-8000-000000000006',
        ],
      });

      const quest = QuestStub({ questType: 'bug-hunt', operations: [] });

      const result = questBuildRelayGraphBroker({
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
            role: 'lawbringer',
            text: 'Lawbringer: standards review across the whole quest diff',
            status: 'pending',
            locked: true,
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
    it('EMPTY: {every op complete after settling, empty relay tail} => operations unchanged, workItems []', () => {
      const proxy = questBuildRelayGraphBrokerProxy();
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
        operations: [completeOp],
        workItems: [],
      });
    });
  });
});
