import { QuestStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { PortFreeTeardownCheckStub } from '../../../contracts/smoketest-teardown-check/smoketest-teardown-check.stub';
import {
  QuestStatusAssertionStub,
  WorkItemRoleCountAssertionStub,
} from '../../../contracts/smoketest-assertion/smoketest-assertion.stub';
import { SmoketestScenarioStub } from '../../../contracts/smoketest-scenario/smoketest-scenario.stub';
import { buildCaseResultLayerBroker } from './build-case-result-layer-broker';
import { buildCaseResultLayerBrokerProxy } from './build-case-result-layer-broker.proxy';

const FIXED_START = 1_000_000;

const TERMINAL_WORK_ITEMS = [
  WorkItemStub({
    id: 'aaaaaaa1-58cc-4372-a567-0e02b2c3d479',
    role: 'pathseeker',
    status: 'complete',
  }),
  WorkItemStub({
    id: 'aaaaaaa2-58cc-4372-a567-0e02b2c3d479',
    role: 'codeweaver',
    status: 'failed',
  }),
  WorkItemStub({
    id: 'aaaaaaa3-58cc-4372-a567-0e02b2c3d479',
    role: 'siegemaster',
    status: 'skipped',
  }),
];

describe('buildCaseResultLayerBroker', () => {
  describe('all clear — quest.status direct terminal', () => {
    it('VALID: {no failures, status: complete} => returns passed=true with final-status=complete summary', () => {
      buildCaseResultLayerBrokerProxy();
      const scenario = SmoketestScenarioStub();

      const result = buildCaseResultLayerBroker({
        scenario,
        startedAt: FIXED_START,
        finalQuest: QuestStub({ status: 'complete' }),
        assertionFailures: [],
        teardownFailures: [],
      });

      expect({
        caseId: result.caseId,
        name: result.name,
        passed: result.passed,
        summary: result.summary,
        errorMessage: result.errorMessage,
      }).toStrictEqual({
        caseId: scenario.caseId,
        name: scenario.name,
        passed: true,
        summary: 'final-status=complete',
        errorMessage: undefined,
      });
    });
  });

  describe('all clear — workItems-terminal fallback annotation', () => {
    it('VALID: {no failures, status: in_progress, all workItems terminal} => returns passed=true with workItems-terminal suffix', () => {
      buildCaseResultLayerBrokerProxy();
      const scenario = SmoketestScenarioStub();

      const result = buildCaseResultLayerBroker({
        scenario,
        startedAt: FIXED_START,
        finalQuest: QuestStub({ status: 'in_progress', workItems: TERMINAL_WORK_ITEMS }),
        assertionFailures: [],
        teardownFailures: [],
      });

      expect({
        passed: result.passed,
        summary: result.summary,
      }).toStrictEqual({
        passed: true,
        summary: 'final-status=in_progress (workItems-terminal)',
      });
    });

    it('VALID: {no failures, status: blocked, all workItems terminal} => returns passed=true without suffix (blocked is direct terminal)', () => {
      buildCaseResultLayerBrokerProxy();
      const scenario = SmoketestScenarioStub();

      const result = buildCaseResultLayerBroker({
        scenario,
        startedAt: FIXED_START,
        finalQuest: QuestStub({ status: 'blocked', workItems: TERMINAL_WORK_ITEMS }),
        assertionFailures: [],
        teardownFailures: [],
      });

      expect({
        passed: result.passed,
        summary: result.summary,
      }).toStrictEqual({
        passed: true,
        summary: 'final-status=blocked',
      });
    });
  });

  describe('assertion failures only', () => {
    it('INVALID: {one quest-status assertion failed} => returns passed=false with assertion-failures errorMessage', () => {
      buildCaseResultLayerBrokerProxy();
      const scenario = SmoketestScenarioStub();

      const result = buildCaseResultLayerBroker({
        scenario,
        startedAt: FIXED_START,
        finalQuest: QuestStub({ status: 'blocked' }),
        assertionFailures: [QuestStatusAssertionStub({ expected: 'complete' })],
        teardownFailures: [],
      });

      expect({
        passed: result.passed,
        errorMessage: result.errorMessage,
        summary: result.summary,
      }).toStrictEqual({
        passed: false,
        errorMessage: 'assertion-failures=[quest-status]',
        summary: undefined,
      });
    });
  });

  describe('teardown failures only', () => {
    it('INVALID: {one port-free teardown failed} => returns passed=false with teardown-failures errorMessage', () => {
      buildCaseResultLayerBrokerProxy();
      const scenario = SmoketestScenarioStub();

      const result = buildCaseResultLayerBroker({
        scenario,
        startedAt: FIXED_START,
        finalQuest: QuestStub({ status: 'complete' }),
        assertionFailures: [],
        teardownFailures: [PortFreeTeardownCheckStub({ port: 4751 })],
      });

      expect({
        passed: result.passed,
        errorMessage: result.errorMessage,
      }).toStrictEqual({
        passed: false,
        errorMessage: 'teardown-failures=[port-free]',
      });
    });
  });

  describe('mixed failures', () => {
    it('INVALID: {one assertion + one teardown failed} => errorMessage concatenates both parts with semicolon', () => {
      buildCaseResultLayerBrokerProxy();
      const scenario = SmoketestScenarioStub();

      const result = buildCaseResultLayerBroker({
        scenario,
        startedAt: FIXED_START,
        finalQuest: QuestStub({ status: 'complete' }),
        assertionFailures: [WorkItemRoleCountAssertionStub({ role: 'pathseeker', minCount: 2 })],
        teardownFailures: [PortFreeTeardownCheckStub({ port: 4751 })],
      });

      expect(result.errorMessage).toBe(
        'assertion-failures=[work-item-role-count]; teardown-failures=[port-free]',
      );
    });
  });
});
