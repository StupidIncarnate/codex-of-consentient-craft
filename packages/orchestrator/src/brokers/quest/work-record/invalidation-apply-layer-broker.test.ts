import {
  FilePathStub,
  FlowEdgeStub,
  FlowIdStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { invalidationApplyLayerBroker } from './invalidation-apply-layer-broker';
import { invalidationApplyLayerBrokerProxy } from './invalidation-apply-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const QUEST_FILE_PATH = FilePathStub({ value: '/home/testuser/.dungeonmaster/quest.json' });
const TARGET_FLOW_ID = FlowIdStub({ value: 'send-flow' });
const OTHER_FLOW_ID = FlowIdStub({ value: 'signup-flow' });
const NOW_AT = '2026-01-15T10:00:00.000Z';

const SIEGE_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
const FLOWRIDER_WORK_ITEM_ID = QuestWorkItemIdStub({
  value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
});

const SIEGE_OP_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000001' });
const FLOWRIDER_OP_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000002' });

const { detail: RESET_REASON } = QuestNoteStub({
  detail: 'Fixed the redirect guard that swallowed the 302.',
});

const SIEGE_OPERATION = OperationItemStub({
  id: SIEGE_OP_ID,
  role: 'siegemaster',
  text: 'Siegemaster: manual QA — flow: send-flow',
  status: 'in_progress',
  flowIds: [TARGET_FLOW_ID],
});

// A siege FIXER's own work item — `step: 'fixHappy'`, NOT `role: 'siegemaster'` on itself. The
// authority check must resolve its FAMILY off the linked operation item, not off this field.
const SIEGE_FIXER_WORK_ITEM = WorkItemStub({
  id: SIEGE_WORK_ITEM_ID,
  role: 'siegemaster',
  step: 'fixHappy',
  status: 'in_progress',
  relatedDataItems: [`operations/${String(SIEGE_OP_ID)}`],
});

const FLOWRIDER_OPERATION = OperationItemStub({
  id: FLOWRIDER_OP_ID,
  role: 'flowrider',
  text: 'Flowrider: author the flow-perspective suites',
  status: 'in_progress',
  flowIds: [TARGET_FLOW_ID],
});

const FLOWRIDER_WORK_ITEM = WorkItemStub({
  id: FLOWRIDER_WORK_ITEM_ID,
  role: 'flowrider',
  status: 'in_progress',
  relatedDataItems: [`operations/${String(FLOWRIDER_OP_ID)}`],
});

const ORPHAN_WORK_ITEM = WorkItemStub({
  id: SIEGE_WORK_ITEM_ID,
  role: 'siegemaster',
  status: 'in_progress',
  relatedDataItems: [],
});

const SIGNED_TARGET_FLOW = FlowStub({
  id: TARGET_FLOW_ID,
  name: 'Send Flow',
  entryPoint: '/send',
  exitPoints: ['/sent'],
  nodes: [
    FlowNodeStub({
      id: 'forward-unchanged',
      label: 'Forward unchanged',
      observables: [FlowObservableStub({ id: 'scan-finds-every-path' })],
    }),
  ],
  edges: [FlowEdgeStub({ id: 'copy-failed' })],
  offMapSignoffs: [FlowOffMapSignoffStub({ id: 'hostile-input' })],
});

describe('invalidationApplyLayerBroker', () => {
  describe('successful invalidation', () => {
    it('VALID: {a siege fixer mid-family, step: fixHappy} => clears every siegemasterSignoff on the flow and appends a walk-reset note', async () => {
      const proxy = invalidationApplyLayerBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [SIEGE_OPERATION],
        workItems: [SIEGE_FIXER_WORK_ITEM],
        flows: [SIGNED_TARGET_FLOW],
      });

      const result = await invalidationApplyLayerBroker({
        quest,
        workItem: SIEGE_FIXER_WORK_ITEM,
        workItemId: SIEGE_WORK_ITEM_ID,
        questId: QUEST_ID,
        questFilePath: QUEST_FILE_PATH,
        flowId: TARGET_FLOW_ID,
        reason: RESET_REASON,
        nowAt: NOW_AT as never,
      });

      expect(result).toStrictEqual({
        kind: 'invalidation',
        flowId: TARGET_FLOW_ID,
        noteId: 'walk-reset-send-flow-1',
        clearedCount: 0,
      });

      const [persisted] = proxy.getPersistedQuests();
      const { planningNotes } = persisted as ReturnType<typeof QuestStub>;

      expect(planningNotes.questNotes).toStrictEqual([
        {
          id: 'walk-reset-send-flow-1',
          kind: 'walk-reset',
          role: 'siegemaster',
          workItemId: SIEGE_WORK_ITEM_ID,
          flowId: TARGET_FLOW_ID,
          summary: 'Siegemaster walk reset for flow send-flow — 0 sign-off(s) cleared',
          detail: RESET_REASON,
          at: NOW_AT,
        },
      ]);
    });
  });

  describe('ownership', () => {
    it('INVALID: {flowId outside the operation item scope} => rejects naming the flow and the work item, persisting nothing', async () => {
      const proxy = invalidationApplyLayerBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [SIEGE_OPERATION],
        workItems: [SIEGE_FIXER_WORK_ITEM],
        flows: [SIGNED_TARGET_FLOW],
      });

      await expect(
        invalidationApplyLayerBroker({
          quest,
          workItem: SIEGE_FIXER_WORK_ITEM,
          workItemId: SIEGE_WORK_ITEM_ID,
          questId: QUEST_ID,
          questFilePath: QUEST_FILE_PATH,
          flowId: OTHER_FLOW_ID,
          reason: RESET_REASON,
          nowAt: NOW_AT as never,
        }),
      ).rejects.toThrow(
        /^quest-work: flow signup-flow is outside the scope of work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa, whose operation item 00000000-0000-4000-8000-000000000001 covers send-flow — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('INVALID: {a flowrider work item asks for a reset} => rejects, family resolves to flowrider not siegemaster', async () => {
      const proxy = invalidationApplyLayerBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [FLOWRIDER_OPERATION],
        workItems: [FLOWRIDER_WORK_ITEM],
        flows: [SIGNED_TARGET_FLOW],
      });

      await expect(
        invalidationApplyLayerBroker({
          quest,
          workItem: FLOWRIDER_WORK_ITEM,
          workItemId: FLOWRIDER_WORK_ITEM_ID,
          questId: QUEST_ID,
          questFilePath: QUEST_FILE_PATH,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
          nowAt: NOW_AT as never,
        }),
      ).rejects.toThrow(
        /^quest-work: only a siegemaster work item may reset a walk — work item bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb is linked to a flowrider operation item \(00000000-0000-4000-8000-000000000002\)$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('INVALID: {work item with no operations/ ref} => rejects, it declares no flow scope to check against', async () => {
      const proxy = invalidationApplyLayerBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [SIEGE_OPERATION],
        workItems: [ORPHAN_WORK_ITEM],
        flows: [SIGNED_TARGET_FLOW],
      });

      await expect(
        invalidationApplyLayerBroker({
          quest,
          workItem: ORPHAN_WORK_ITEM,
          workItemId: SIEGE_WORK_ITEM_ID,
          questId: QUEST_ID,
          questFilePath: QUEST_FILE_PATH,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
          nowAt: NOW_AT as never,
        }),
      ).rejects.toThrow(
        /^quest-work: work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa has no linked operation item on quest add-auth, so it declares no flow scope — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('the no-flows-at-all branch', () => {
    it("INVALID: {operation item declares zero flowIds} => the scope reads 'no flows at all', not empty", async () => {
      const proxy = invalidationApplyLayerBrokerProxy();
      const emptyScopeOperation = OperationItemStub({
        id: SIEGE_OP_ID,
        role: 'siegemaster',
        text: 'Siegemaster: contracts-only cell',
        status: 'in_progress',
        flowIds: [],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [emptyScopeOperation],
        workItems: [SIEGE_FIXER_WORK_ITEM],
        flows: [SIGNED_TARGET_FLOW],
      });

      await expect(
        invalidationApplyLayerBroker({
          quest,
          workItem: SIEGE_FIXER_WORK_ITEM,
          workItemId: SIEGE_WORK_ITEM_ID,
          questId: QUEST_ID,
          questFilePath: QUEST_FILE_PATH,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
          nowAt: NOW_AT as never,
        }),
      ).rejects.toThrow(
        /^quest-work: flow send-flow is outside the scope of work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa, whose operation item 00000000-0000-4000-8000-000000000001 covers no flows at all — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {flowId in scope but absent from the quest} => throws naming the missing flow', async () => {
      const proxy = invalidationApplyLayerBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [SIEGE_OPERATION],
        workItems: [SIEGE_FIXER_WORK_ITEM],
        flows: [],
      });

      await expect(
        invalidationApplyLayerBroker({
          quest,
          workItem: SIEGE_FIXER_WORK_ITEM,
          workItemId: SIEGE_WORK_ITEM_ID,
          questId: QUEST_ID,
          questFilePath: QUEST_FILE_PATH,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
          nowAt: NOW_AT as never,
        }),
      ).rejects.toThrow(
        /^quest-work: flow send-flow is not on quest add-auth — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });
});
