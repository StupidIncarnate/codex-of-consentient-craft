import { QuestStub, QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import {
  QuestStatusAssertionStub,
  WorkItemRoleCountAssertionStub,
  WorkItemStatusHistogramAssertionStub,
} from '../../../contracts/smoketest-assertion/smoketest-assertion.stub';
import { smoketestAssertFinalStateBroker } from './smoketest-assert-final-state-broker';
import { smoketestAssertFinalStateBrokerProxy } from './smoketest-assert-final-state-broker.proxy';

const WI_1 = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1' });
const WI_2 = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2' });
const WI_3 = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3' });
const WI_4 = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4' });

const completeQuest = QuestStub({
  status: 'complete',
  workItems: [
    WorkItemStub({ id: WI_1, role: 'pathseeker', status: 'complete' }),
    WorkItemStub({ id: WI_2, role: 'pathseeker', status: 'complete' }),
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
      const roleAssertion = WorkItemRoleCountAssertionStub({ role: 'pathseeker', minCount: 2 });

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
    it('INVALID: {requires 3 pathseekers, quest has 2} => returns failures containing role assertion', () => {
      smoketestAssertFinalStateBrokerProxy();
      const roleAssertion = WorkItemRoleCountAssertionStub({ role: 'pathseeker', minCount: 3 });

      const result = smoketestAssertFinalStateBroker({
        quest: completeQuest,
        assertions: [roleAssertion],
      });

      expect(result).toStrictEqual({ passed: false, failures: [roleAssertion] });
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
