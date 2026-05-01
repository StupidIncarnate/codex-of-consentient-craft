import { rulePrefixExtractTransformer } from './rule-prefix-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('rulePrefixExtractTransformer', () => {
  describe('known prefixes', () => {
    it('VALID: {ruleName: ban-primitives} => returns ban', () => {
      const result = rulePrefixExtractTransformer({
        ruleName: ContentTextStub({ value: 'ban-primitives' }),
      });

      expect(String(result)).toBe('ban');
    });

    it('VALID: {ruleName: enforce-project-structure} => returns enforce', () => {
      const result = rulePrefixExtractTransformer({
        ruleName: ContentTextStub({ value: 'enforce-project-structure' }),
      });

      expect(String(result)).toBe('enforce');
    });

    it('VALID: {ruleName: forbid-non-exported-functions} => returns forbid', () => {
      const result = rulePrefixExtractTransformer({
        ruleName: ContentTextStub({ value: 'forbid-non-exported-functions' }),
      });

      expect(String(result)).toBe('forbid');
    });

    it('VALID: {ruleName: require-contract-validation} => returns require', () => {
      const result = rulePrefixExtractTransformer({
        ruleName: ContentTextStub({ value: 'require-contract-validation' }),
      });

      expect(String(result)).toBe('require');
    });

    it('VALID: {ruleName: no-bare-process-cwd} => returns no', () => {
      const result = rulePrefixExtractTransformer({
        ruleName: ContentTextStub({ value: 'no-bare-process-cwd' }),
      });

      expect(String(result)).toBe('no');
    });
  });

  describe('unknown prefix', () => {
    it('VALID: {ruleName: custom-rule} => returns other', () => {
      const result = rulePrefixExtractTransformer({
        ruleName: ContentTextStub({ value: 'custom-rule' }),
      });

      expect(String(result)).toBe('other');
    });

    it('VALID: {ruleName: ban} => returns other (no trailing dash)', () => {
      const result = rulePrefixExtractTransformer({
        ruleName: ContentTextStub({ value: 'ban' }),
      });

      expect(String(result)).toBe('other');
    });
  });
});
