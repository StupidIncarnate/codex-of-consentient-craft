import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questValidateSpecTransformer } from './quest-validate-spec-transformer';

describe('questValidateSpecTransformer', () => {
  describe('check names', () => {
    it('VALID: {default quest} => returns 18 named checks in fixed order', () => {
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest });

      expect(checks.map((check) => String(check.name))).toStrictEqual([
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
    });
  });

  describe('all checks pass on default quest', () => {
    it('VALID: {default empty quest} => all checks pass', () => {
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest });

      expect(checks.every((check) => check.passed)).toBe(true);
    });
  });
});
