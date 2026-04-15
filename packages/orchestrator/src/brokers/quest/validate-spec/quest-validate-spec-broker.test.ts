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

  // Note: "failing validation" describe block removed because the only failure
  // scenario tested (flow with empty exitPoints[]) is now rejected at parse
  // time by flowContract (exitPoints is .min(1)). The scenario cannot
  // round-trip through questLoadBroker to reach the transformer, so the
  // broker-level failure test is unreachable. Transformer-level failure tests
  // still exist in quest-validate-spec-transformer.test.ts using Object.assign
  // bypass on in-memory quests.

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

  describe('load failure', () => {
    it('ERROR: {questLoadBroker throws} => returns success false with error message', async () => {
      const proxy = questValidateSpecBrokerProxy();
      const quest = QuestStub({ id: 'load-fail', folder: '001-load-fail' });

      proxy.setupLoadFailure({
        quest,
        error: new Error('simulated load failure'),
      });

      const input = ValidateSpecInputStub({ questId: 'load-fail' });
      const result = await questValidateSpecBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error:
          'Failed to read file at /home/testuser/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests/001-load-fail/quest.json',
      });
    });
  });
});
