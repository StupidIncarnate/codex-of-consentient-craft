import { QuestStub } from '@dungeonmaster/shared/contracts';

import { ValidateSpecInputStub } from '../../../contracts/validate-spec-input/validate-spec-input.stub';
import { questValidateSpecBroker } from './quest-validate-spec-broker';
import { questValidateSpecBrokerProxy } from './quest-validate-spec-broker.proxy';

describe('questValidateSpecBroker', () => {
  describe('successful validation', () => {
    it('VALID: {default quest} => returns success true with all 18 checks', async () => {
      const proxy = questValidateSpecBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = ValidateSpecInputStub({ questId: 'add-auth' });
      const result = await questValidateSpecBroker({ input });

      expect(result.success).toBe(true);
      expect(result.checks.map((c) => String(c.name))).toStrictEqual([
        'Flow Required Fields',
        'Flow ID Uniqueness',
        'Flow Node ID Uniqueness',
        'No Orphan Flow Nodes',
        'No Dead-End Non-Terminal Nodes',
        'Decision Node Branching',
        'Decision Edge Labels',
        'Terminal Node Observable Coverage',
        'Flow Edge ID Uniqueness',
        'Valid Flow References',
        'Observable Descriptions',
        'Observable ID Uniqueness Within Node',
        'Contract Node Anchoring',
        'Contract Name Uniqueness',
        'No Raw Primitives in Contracts',
        'Design Decision ID Uniqueness',
        'Design Decision Rationale',
        'Step Focus Target',
      ]);
      expect(result.checks.every((check) => check.passed)).toBe(true);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId: nonexistent} => returns not found error', async () => {
      const proxy = questValidateSpecBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = ValidateSpecInputStub({ questId: 'nonexistent' });
      const result = await questValidateSpecBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questValidateSpecBrokerProxy();

      proxy.setupEmptyFolder();

      const input = ValidateSpecInputStub({ questId: 'any-quest' });
      const result = await questValidateSpecBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest with id "any-quest" not found in any guild',
      });
    });
  });
});
