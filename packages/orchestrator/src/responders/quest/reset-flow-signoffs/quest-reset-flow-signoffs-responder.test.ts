import {
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SignoffStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestResetFlowSignoffsResponderProxy } from './quest-reset-flow-signoffs-responder.proxy';

const QUEST_ID = QuestIdStub({ value: 'reset-walk-quest' });
const SIEGE_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
const SIEGE_OP_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000001' });

const RESET_REASON =
  'Fixed the redirect guard, so every sign-off on this flow measured a dead build.';

const SIEGE_SIGNOFF = SignoffStub({
  evidence: 'walked it against the dev server — landed on /dashboard',
  workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  at: '2026-01-02T00:00:00.000Z',
});

const questWithSignedFlow = QuestStub({
  id: QUEST_ID,
  operations: [
    OperationItemStub({
      id: SIEGE_OP_ID,
      role: 'siegemaster',
      text: 'Siegemaster: manual QA — flow: login-flow',
      status: 'in_progress',
      locked: true,
      flowIds: ['login-flow'],
    }),
  ],
  workItems: [
    WorkItemStub({
      id: SIEGE_WORK_ITEM_ID,
      role: 'siegemaster',
      status: 'in_progress',
      relatedDataItems: [`operations/${String(SIEGE_OP_ID)}`],
    }),
  ],
  flows: [
    FlowStub({
      id: 'login-flow',
      nodes: [
        FlowNodeStub({
          id: 'login-page',
          label: 'Login Page',
          siegemasterSignoff: SIEGE_SIGNOFF,
          observables: [
            FlowObservableStub({
              id: 'login-redirects-to-dashboard',
              siegemasterSignoff: SIEGE_SIGNOFF,
            }),
          ],
        }),
      ],
      offMapSignoffs: [
        FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff: SIEGE_SIGNOFF }),
      ],
    }),
  ],
});

describe('QuestResetFlowSignoffsResponder', () => {
  describe('successful reset', () => {
    it('VALID: {siegemaster work item, in-scope flow} => reports the cleared count and the note it recorded', async () => {
      const proxy = QuestResetFlowSignoffsResponderProxy();
      proxy.setupQuestFound({ quest: questWithSignedFlow });

      const result = await proxy.callResponder({
        questId: 'reset-walk-quest',
        workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        flowId: 'login-flow',
        reason: RESET_REASON,
      });

      expect(result).toStrictEqual({
        success: true,
        data: [
          'Siegemaster walk reset for flow login-flow.',
          "Cleared 3 siegemasterSignoff value(s) across this flow's observables, nodes, edges and off-map probe families. Flowrider's track was not touched.",
          'Recorded as quest note walk-reset-login-flow-1 (kind: walk-reset).',
          'Re-walk the flow from the reset state and sign each unit off again as you go.',
        ].join('\n'),
      });
    });
  });

  describe('refusals', () => {
    it('INVALID: {flow outside the caller scope} => returns success false carrying the broker message', async () => {
      const proxy = QuestResetFlowSignoffsResponderProxy();
      proxy.setupQuestFound({ quest: questWithSignedFlow });

      const result = await proxy.callResponder({
        questId: 'reset-walk-quest',
        workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        flowId: 'signup-flow',
        reason: RESET_REASON,
      });

      expect(result).toStrictEqual({
        success: false,
        error:
          'reset-flow-signoffs: flow signup-flow is outside the scope of work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa, whose operation item 00000000-0000-4000-8000-000000000001 covers login-flow — nothing was reset',
      });
      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('INVALID: {workItemId is not a uuid} => returns success false without reaching the broker', async () => {
      const proxy = QuestResetFlowSignoffsResponderProxy();
      proxy.setupQuestFound({ quest: questWithSignedFlow });

      const result = await proxy.callResponder({
        questId: 'reset-walk-quest',
        workItemId: 'not-a-uuid',
        flowId: 'login-flow',
        reason: RESET_REASON,
      });

      expect(result.success).toBe(false);
      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('EMPTY: {reason: ""} => returns success false, a walk reset must say why', async () => {
      const proxy = QuestResetFlowSignoffsResponderProxy();
      proxy.setupQuestFound({ quest: questWithSignedFlow });

      const result = await proxy.callResponder({
        questId: 'reset-walk-quest',
        workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        flowId: 'login-flow',
        reason: '',
      });

      expect(result.success).toBe(false);
      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {no quest on disk} => returns success false naming the missing quest', async () => {
      const proxy = QuestResetFlowSignoffsResponderProxy();
      proxy.setupQuestNotFound();

      const result = await proxy.callResponder({
        questId: 'reset-walk-quest',
        workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        flowId: 'login-flow',
        reason: RESET_REASON,
      });

      expect(result.success).toBe(false);
      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });
});
