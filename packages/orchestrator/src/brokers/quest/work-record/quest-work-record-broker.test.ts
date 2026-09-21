import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestWorkInstanceStub } from '../../../contracts/quest-work-instance/quest-work-instance.stub';
import { questWorkRecordBroker } from './quest-work-record-broker';
import { questWorkRecordBrokerProxy } from './quest-work-record-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
const OTHER_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' });
const SIEGE_OP_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000001' });

describe('questWorkRecordBroker', () => {
  describe('observations', () => {
    it('VALID: {one met observation} => persists it on the work item and returns the count', async () => {
      const proxy = questWorkRecordBrokerProxy();
      const workItem = WorkItemStub({ id: WORK_ITEM_ID, observations: [] });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const result = await questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: {
          kind: 'observations',
          observations: [
            {
              unitId: 'send-flow:observable:scan-finds-every-path',
              mark: 'met',
              evidence: 'send.test.ts:12 — passes with two boxes',
            },
          ],
        } as never,
      });

      expect(result).toStrictEqual({ kind: 'observations', count: 1 });

      const [persisted] = proxy.getPersistedQuests();
      const { workItems } = persisted as ReturnType<typeof QuestStub>;

      expect(workItems[0]?.observations).toStrictEqual([
        {
          unitId: 'send-flow:observable:scan-finds-every-path',
          mark: 'met',
          evidence: 'send.test.ts:12 — passes with two boxes',
          at: '2026-01-15T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('outcome', () => {
    it("VALID: {no assigned units, word: 'empty'} => persists the declared word and reason", async () => {
      const proxy = questWorkRecordBrokerProxy();
      const workItem = WorkItemStub({ id: WORK_ITEM_ID, assignedUnitIds: [], observations: [] });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const result = await questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'outcome', word: 'empty', reason: 'no piece was cut this pass' } as never,
      });

      expect(result).toStrictEqual({ kind: 'outcome', word: 'empty' });

      const [persisted] = proxy.getPersistedQuests();
      const { workItems } = persisted as ReturnType<typeof QuestStub>;

      expect(workItems[0]).toStrictEqual({
        ...workItem,
        declaredWord: 'empty',
        declaredReason: 'no piece was cut this pass',
      });
    });

    it("VALID: {needsLane item with a recorded instance, word: 'done'} => kills the lane it started", async () => {
      const proxy = questWorkRecordBrokerProxy();
      proxy.setupLaneKill();
      const instance = QuestWorkInstanceStub();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'siegemaster',
        step: 'happyWalk',
        needsLane: true,
        assignedUnitIds: [],
        observations: [],
        payload: { instance },
      });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const result = await questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'outcome', word: 'done', reason: 'both walks reported clean' } as never,
      });

      expect(result).toStrictEqual({ kind: 'outcome', word: 'done' });
      expect(proxy.getKilledInstanceIds()).toStrictEqual([instance.instanceId]);
    });

    it("VALID: {needsLane item with a recorded instance, word: 'wall'} => kills the lane, whatever the outcome", async () => {
      const proxy = questWorkRecordBrokerProxy();
      proxy.setupLaneKill();
      const instance = QuestWorkInstanceStub();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'siegemaster',
        step: 'happyWalk',
        needsLane: true,
        assignedUnitIds: [],
        observations: [],
        payload: { instance },
      });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const result = await questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: {
          kind: 'outcome',
          word: 'wall',
          reason: 'the driver never answered ping',
        } as never,
      });

      expect(result).toStrictEqual({ kind: 'outcome', word: 'wall' });
      expect(proxy.getKilledInstanceIds()).toStrictEqual([instance.instanceId]);
    });

    it("VALID: {not a needsLane item, word: 'done'} => never touches the lane broker at all", async () => {
      const proxy = questWorkRecordBrokerProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        assignedUnitIds: [],
        observations: [],
      });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const result = await questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'outcome', word: 'done', reason: 'the cell is complete' } as never,
      });

      expect(result).toStrictEqual({ kind: 'outcome', word: 'done' });
      expect(proxy.getKilledInstanceIds()).toStrictEqual([]);
    });

    it('ERROR: {assigned units contradict the declared word} => throws naming them, persists nothing', async () => {
      const proxy = questWorkRecordBrokerProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        assignedUnitIds: ['send-flow:observable:scan-finds-every-path'],
        observations: [],
      });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      await expect(
        questWorkRecordBroker({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'outcome', word: 'done', reason: 'everything passed' } as never,
        }),
      ).rejects.toThrow(/quest-work: work item .* is assigned 1 unit\(s\)/u);

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('request', () => {
    it('VALID: {step: recipe, mintableOnRequest} => persists the requested step and reason', async () => {
      const proxy = questWorkRecordBrokerProxy();
      const operationItem = OperationItemStub({ id: SIEGE_OP_ID, role: 'siegemaster' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'siegemaster',
        relatedDataItems: [`operations/${String(SIEGE_OP_ID)}`],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operationItem],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'request', step: 'recipe', reason: 'the seed is missing' } as never,
      });

      expect(result).toStrictEqual({ kind: 'request', step: 'recipe' });

      const [persisted] = proxy.getPersistedQuests();
      const { workItems } = persisted as ReturnType<typeof QuestStub>;

      expect(workItems[0]).toStrictEqual({
        ...workItem,
        requestedStep: 'recipe',
        requestedReason: 'the seed is missing',
      });
    });

    it('ERROR: {step not mintableOnRequest} => throws naming the step and family, persists nothing', async () => {
      const proxy = questWorkRecordBrokerProxy();
      const operationItem = OperationItemStub({ id: SIEGE_OP_ID, role: 'siegemaster' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'siegemaster',
        relatedDataItems: [`operations/${String(SIEGE_OP_ID)}`],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operationItem],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      await expect(
        questWorkRecordBroker({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'request', step: 'happyWalk', reason: 'let me skip ahead' } as never,
        }),
      ).rejects.toThrow(
        /^quest-work: step 'happyWalk' is not mintableOnRequest in family 'siegemaster'/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('the asking work item is not on the quest', () => {
    it('ERROR: {an unknown workItemId} => throws naming it, nothing recorded', async () => {
      const proxy = questWorkRecordBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, workItems: [] });
      proxy.setupQuestFound({ quest });

      await expect(
        questWorkRecordBroker({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'outcome', word: 'done', reason: 'ok' } as never,
        }),
      ).rejects.toThrow(
        /^quest-work: work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa is not on quest add-auth — nothing was recorded$/u,
      );
    });

    it("ERROR: {kind: invalidation, an unknown workItemId} => throws naming the work item, 'nothing was reset'", async () => {
      const proxy = questWorkRecordBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, workItems: [] });
      proxy.setupQuestFound({ quest });

      await expect(
        questWorkRecordBroker({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: {
            kind: 'invalidation',
            flowId: 'send-flow',
            reason: 'fixed the guard',
          } as never,
        }),
      ).rejects.toThrow(
        /^quest-work: work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa is not on quest add-auth — nothing was reset$/u,
      );
    });
  });

  describe('concurrency', () => {
    it('VALID: {two observations calls for different work items, fired without awaiting the first} => both land, neither overwrites the other', async () => {
      const proxy = questWorkRecordBrokerProxy();
      const workItemA = WorkItemStub({ id: WORK_ITEM_ID, observations: [] });
      const workItemB = WorkItemStub({ id: OTHER_WORK_ITEM_ID, observations: [] });
      const startingQuest = QuestStub({ id: QUEST_ID, workItems: [workItemA, workItemB] });
      proxy.setupQuestFound({ quest: startingQuest });

      const observationA = UnitObservationStub({
        unitId: 'send-flow:observable:scan-finds-every-path',
        mark: 'met',
      });
      const observationB = UnitObservationStub({
        unitId: 'send-flow:terminal:forward-unchanged',
        mark: 'met',
      });
      // The SECOND read a lock-serialized call actually gets: item A's observation already
      // landed from the first call's write. Awaiting the first call before firing the second
      // would prove nothing about the lock — both calls are fired here, and only THEN awaited.
      proxy.queueNextQuestRead({
        quest: QuestStub({
          id: QUEST_ID,
          workItems: [{ ...workItemA, observations: [observationA] }, workItemB],
        }),
      });

      const callA = questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: {
          kind: 'observations',
          observations: [
            {
              unitId: observationA.unitId,
              mark: observationA.mark,
              evidence: observationA.evidence,
            },
          ],
        } as never,
      });
      const callB = questWorkRecordBroker({
        questId: QUEST_ID,
        workItemId: OTHER_WORK_ITEM_ID,
        payload: {
          kind: 'observations',
          observations: [
            {
              unitId: observationB.unitId,
              mark: observationB.mark,
              evidence: observationB.evidence,
            },
          ],
        } as never,
      });

      await Promise.all([callA, callB]);

      const persisted = proxy.getPersistedQuests();
      const [, second] = persisted as ReturnType<typeof QuestStub>[];

      // `second` is the SECOND write — call B's own — read against the fixture above (item A
      // already carrying its observation, standing in for call A's own completed write). Item A's
      // `at` here is that fixture's own stamp, not call B's `nowAt`: B never re-touches item A.
      expect(second?.workItems.map((item) => item.observations)).toStrictEqual([
        [
          {
            unitId: observationA.unitId,
            mark: observationA.mark,
            evidence: observationA.evidence,
            at: observationA.at,
          },
        ],
        [
          {
            unitId: observationB.unitId,
            mark: observationB.mark,
            evidence: observationB.evidence,
            at: '2026-01-15T10:00:00.000Z',
          },
        ],
      ]);
    });
  });
});
