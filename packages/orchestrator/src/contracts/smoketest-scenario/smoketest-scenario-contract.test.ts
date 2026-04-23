import { QuestBlueprintStub } from '../quest-blueprint/quest-blueprint.stub';
import {
  PortFreeTeardownCheckStub,
  ProcessGoneTeardownCheckStub,
} from '../smoketest-teardown-check/smoketest-teardown-check.stub';
import { WorkItemRoleCountAssertionStub } from '../smoketest-assertion/smoketest-assertion.stub';
import { smoketestScenarioContract } from './smoketest-scenario-contract';
import { SmoketestScenarioStub } from './smoketest-scenario.stub';

describe('smoketestScenarioContract', () => {
  describe('valid scenarios', () => {
    it('VALID: {default stub} => parses with caseId, name, blueprint, scripts, and assertions', () => {
      const result = SmoketestScenarioStub();

      expect(result).toStrictEqual({
        caseId: 'orch-happy',
        name: 'Orchestration: happy path',
        blueprint: QuestBlueprintStub(),
        scripts: { codeweaver: ['signalComplete'], pathseeker: ['signalComplete'] },
        assertions: [{ kind: 'quest-status', expected: 'complete' }],
      });
    });

    it('VALID: {postTeardownChecks: [port-free, process-gone]} => parses with teardown checks', () => {
      const result = SmoketestScenarioStub({
        postTeardownChecks: [
          PortFreeTeardownCheckStub({ port: 4751 }),
          ProcessGoneTeardownCheckStub({ pid: 999 }),
        ],
      });

      expect(result.postTeardownChecks).toStrictEqual([
        { kind: 'port-free', port: 4751 },
        { kind: 'process-gone', pid: 999 },
      ]);
    });

    it('VALID: {assertions with multiple kinds} => parses all three assertion variants', () => {
      const result = SmoketestScenarioStub({
        assertions: [
          { kind: 'quest-status', expected: 'complete' },
          {
            kind: 'work-item-status-histogram',
            expected: { complete: 3, skipped: 0 },
          },
          WorkItemRoleCountAssertionStub({ role: 'pathseeker', minCount: 2 }),
        ],
      });

      expect(result.assertions).toStrictEqual([
        { kind: 'quest-status', expected: 'complete' },
        { kind: 'work-item-status-histogram', expected: { complete: 3, skipped: 0 } },
        { kind: 'work-item-role-count', role: 'pathseeker', minCount: 2 },
      ]);
    });
  });

  describe('invalid scenarios', () => {
    it('INVALID: {scripts contains unknown prompt name} => throws validation error', () => {
      expect(() => {
        smoketestScenarioContract.parse({
          caseId: 'c1',
          name: 'n1',
          blueprint: QuestBlueprintStub(),
          scripts: { codeweaver: ['notARealPromptName'] },
          assertions: [],
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {scripts contains unknown role} => throws validation error', () => {
      expect(() => {
        smoketestScenarioContract.parse({
          caseId: 'c1',
          name: 'n1',
          blueprint: QuestBlueprintStub(),
          scripts: { bogusRole: ['signalComplete'] },
          assertions: [],
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {caseId empty} => throws validation error', () => {
      expect(() => {
        smoketestScenarioContract.parse({
          caseId: '',
          name: 'n1',
          blueprint: QuestBlueprintStub(),
          scripts: {},
          assertions: [],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {name empty} => throws validation error', () => {
      expect(() => {
        smoketestScenarioContract.parse({
          caseId: 'c1',
          name: '',
          blueprint: QuestBlueprintStub(),
          scripts: {},
          assertions: [],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
