import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import {
  QuestStatusAssertionStub,
  WorkItemRoleCountAssertionStub,
  WorkItemSignalMatchAssertionStub,
  WorkItemStatusHistogramAssertionStub,
} from '../../../contracts/smoketest-assertion/smoketest-assertion.stub';
import { smoketestAssertFinalStateBroker } from './smoketest-assert-final-state-broker';
import { smoketestAssertFinalStateBrokerProxy } from './smoketest-assert-final-state-broker.proxy';

const WI_1 = QuestWorkItemIdStub({ value: '96a0b069-bd3d-31a1-b298-838febb93560' });
const WI_2 = QuestWorkItemIdStub({ value: 'e771e02e-baf1-787c-861c-7bca87de9968' });
const WI_3 = QuestWorkItemIdStub({ value: '51bbfb31-fc82-6426-8546-117f3152cf8b' });
const WI_4 = QuestWorkItemIdStub({ value: 'cc6c4bc4-fa45-4874-b1e7-930ef7cf5841' });

const completeQuest = QuestStub({
  status: 'complete',
  workItems: [
    WorkItemStub({ id: WI_1, role: 'flowrider', status: 'complete' }),
    WorkItemStub({ id: WI_2, role: 'flowrider', status: 'complete' }),
    WorkItemStub({ id: WI_3, role: 'codeweaver', status: 'complete' }),
    WorkItemStub({ id: WI_4, role: 'codeweaver', status: 'skipped' }),
  ],
});

const blockedQuest = QuestStub({
  status: 'blocked',
  workItems: [WorkItemStub({ id: WI_1, role: 'codeweaver', status: 'failed' })],
});

describe('smoketestAssertFinalStateBroker', () => {
  describe('all assertions pass', () => {
    it('VALID: {quest-status match, histogram exact, role count met} => returns passed with empty failures', () => {
      smoketestAssertFinalStateBrokerProxy();
      const statusAssertion = QuestStatusAssertionStub({ expected: 'complete' });
      const histogramAssertion = WorkItemStatusHistogramAssertionStub({
        expected: { complete: 3, skipped: 1 },
      });
      const roleAssertion = WorkItemRoleCountAssertionStub({ role: 'flowrider', minCount: 2 });

      const result = smoketestAssertFinalStateBroker({
        quest: completeQuest,
        assertions: [statusAssertion, histogramAssertion, roleAssertion],
      });

      expect(result).toStrictEqual({ passed: true, failures: [] });
    });
  });

  describe('quest-status mismatch', () => {
    it('INVALID: {expected complete, actual blocked} => returns failures containing status assertion', () => {
      smoketestAssertFinalStateBrokerProxy();
      const statusAssertion = QuestStatusAssertionStub({ expected: 'complete' });

      const result = smoketestAssertFinalStateBroker({
        quest: blockedQuest,
        assertions: [statusAssertion],
      });

      expect(result).toStrictEqual({ passed: false, failures: [statusAssertion] });
    });
  });

  describe('work-item-status-histogram mismatch', () => {
    it('INVALID: {histogram expects 2 complete, quest has 3} => returns failures containing histogram assertion', () => {
      smoketestAssertFinalStateBrokerProxy();
      const histogramAssertion = WorkItemStatusHistogramAssertionStub({
        expected: { complete: 2 },
      });

      const result = smoketestAssertFinalStateBroker({
        quest: completeQuest,
        assertions: [histogramAssertion],
      });

      expect(result).toStrictEqual({ passed: false, failures: [histogramAssertion] });
    });
  });

  describe('work-item-role-count below minCount', () => {
    it('INVALID: {requires 3 flowriders, quest has 2} => returns failures containing role assertion', () => {
      smoketestAssertFinalStateBrokerProxy();
      const roleAssertion = WorkItemRoleCountAssertionStub({ role: 'flowrider', minCount: 3 });

      const result = smoketestAssertFinalStateBroker({
        quest: completeQuest,
        assertions: [roleAssertion],
      });

      expect(result).toStrictEqual({ passed: false, failures: [roleAssertion] });
    });
  });

  describe('work-item-signal-match', () => {
    it('VALID: {every item with expected has matching actual} => returns passed', () => {
      smoketestAssertFinalStateBrokerProxy();
      const signalMatchAssertion = WorkItemSignalMatchAssertionStub();
      const quest = QuestStub({
        status: 'complete',
        workItems: [
          WorkItemStub({
            id: WI_1,
            role: 'codeweaver',
            status: 'complete',
            smoketestExpectedSignal: 'complete',
            actualSignal: 'complete',
          }),
          WorkItemStub({
            id: WI_2,
            role: 'flowrider',
            status: 'complete',
            smoketestExpectedSignal: 'complete',
            actualSignal: 'complete',
          }),
          // Items without expected signal are ignored
          WorkItemStub({ id: WI_3, role: 'siegemaster', status: 'complete' }),
        ],
      });

      const result = smoketestAssertFinalStateBroker({
        quest,
        assertions: [signalMatchAssertion],
      });

      expect(result).toStrictEqual({ passed: true, failures: [] });
    });

    it('INVALID: {one item expects complete but never signaled (actual undefined)} => returns failures containing signal-match assertion', () => {
      smoketestAssertFinalStateBrokerProxy();
      const signalMatchAssertion = WorkItemSignalMatchAssertionStub();
      const quest = QuestStub({
        status: 'complete',
        workItems: [
          WorkItemStub({
            id: WI_1,
            role: 'codeweaver',
            status: 'complete',
            smoketestExpectedSignal: 'complete',
            actualSignal: 'complete',
          }),
          WorkItemStub({
            id: WI_2,
            role: 'codeweaver',
            status: 'complete',
            smoketestExpectedSignal: 'complete',
          }),
        ],
      });

      const result = smoketestAssertFinalStateBroker({
        quest,
        assertions: [signalMatchAssertion],
      });

      expect(result).toStrictEqual({ passed: false, failures: [signalMatchAssertion] });
    });
  });

  describe('mixed pass/fail preserves input order', () => {
    it('INVALID: {first passes, second fails, third passes} => failures contain only the second in original order', () => {
      smoketestAssertFinalStateBrokerProxy();
      const passingStatus = QuestStatusAssertionStub({ expected: 'complete' });
      const failingHistogram = WorkItemStatusHistogramAssertionStub({
        expected: { complete: 99 },
      });
      const passingRole = WorkItemRoleCountAssertionStub({ role: 'codeweaver', minCount: 1 });

      const result = smoketestAssertFinalStateBroker({
        quest: completeQuest,
        assertions: [passingStatus, failingHistogram, passingRole],
      });

      expect(result).toStrictEqual({ passed: false, failures: [failingHistogram] });
    });
  });
});
