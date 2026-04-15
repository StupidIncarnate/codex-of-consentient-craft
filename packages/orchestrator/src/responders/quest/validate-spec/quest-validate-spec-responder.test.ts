import { QuestStub } from '@dungeonmaster/shared/contracts';

import { QuestValidateSpecResponderProxy } from './quest-validate-spec-responder.proxy';

describe('QuestValidateSpecResponder', () => {
  describe('successful validation', () => {
    it('VALID: {questId} => returns validation result via broker', async () => {
      const quest = QuestStub();
      const proxy = QuestValidateSpecResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result.success).toBe(true);
      expect(result.checks.map((c) => String(c.name))).toStrictEqual([
        'Flow ID Uniqueness',
        'Flow Node ID Uniqueness',
        'Flow Edge ID Uniqueness',
        'Observable ID Uniqueness Within Node',
        'Contract Name Uniqueness',
        'Design Decision ID Uniqueness',
        'Valid Flow References',
        'Contract Node Anchoring',
        'No Raw Primitives in Contracts',
        'No Orphan Flow Nodes',
        'No Dead-End Non-Terminal Nodes',
        'Decision Node Branching',
        'Decision Edge Labels',
        'Terminal Node Observable Coverage',
        'Observable Descriptions',
        'Design Decision Rationale',
      ]);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId: nonexistent} => returns error result with message and empty checks', async () => {
      const proxy = QuestValidateSpecResponderProxy();
      proxy.setupEmptyFolder();

      const result = await proxy.callResponder({ questId: 'nonexistent-quest' });

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest with id "nonexistent-quest" not found in any guild',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {empty questId} => throws ZodError for min length', async () => {
      const proxy = QuestValidateSpecResponderProxy();
      proxy.setupEmptyFolder();

      await expect(proxy.callResponder({ questId: '' })).rejects.toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
