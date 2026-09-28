import { preEditRuleNamesExtractTransformer } from './pre-edit-rule-names-extract-transformer';
import { dungeonmasterRuleEnforceOnStatics } from '../../statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('preEditRuleNamesExtractTransformer', () => {
  describe('rule filtering', () => {
    it('VALID: {enforceOn with pre-edit and post-edit rules} => returns only pre-edit rule names', () => {
      const result = preEditRuleNamesExtractTransformer({
        enforceOn: {
          'rule-alpha': 'pre-edit',
          'rule-beta': 'post-edit',
          'rule-gamma': 'pre-edit',
        },
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: 'rule-alpha' }),
        ContentTextStub({ value: 'rule-gamma' }),
      ]);
    });

    it('VALID: {enforceOn with real dungeonmasterRuleEnforceOnStatics} => returns pre-edit rules matching statics', () => {
      const expectedRules = Object.entries(dungeonmasterRuleEnforceOnStatics)
        .filter(([, timing]) => timing === 'pre-edit')
        .map(([ruleName]) => ContentTextStub({ value: ruleName }));

      const result = preEditRuleNamesExtractTransformer({
        enforceOn: dungeonmasterRuleEnforceOnStatics,
      });

      expect(result).toStrictEqual(expectedRules);
      expect(result.length).toBeGreaterThan(30);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {enforceOn with no pre-edit rules} => returns empty array', () => {
      const result = preEditRuleNamesExtractTransformer({
        enforceOn: {
          'rule-one': 'post-edit',
          'rule-two': 'post-edit',
        },
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {enforceOn is empty} => returns empty array', () => {
      const result = preEditRuleNamesExtractTransformer({
        enforceOn: {},
      });

      expect(result).toStrictEqual([]);
    });
  });
});
