import { rulePrefixGroupContract } from './rule-prefix-group-contract';
import { RulePrefixGroupStub } from './rule-prefix-group.stub';

describe('rulePrefixGroupContract', () => {
  describe('valid input', () => {
    it('VALID: {stub defaults} => parses successfully with ban prefix', () => {
      const result = RulePrefixGroupStub();

      expect(result).toStrictEqual({
        prefix: 'ban',
        names: ['ban-primitives'],
      });
    });

    it('VALID: {prefix and names} => parses successfully', () => {
      const result = rulePrefixGroupContract.parse({
        prefix: 'enforce',
        names: ['enforce-project-structure', 'enforce-zod-types'],
      });

      expect(result).toStrictEqual({
        prefix: 'enforce',
        names: ['enforce-project-structure', 'enforce-zod-types'],
      });
    });

    it('VALID: {empty names array} => parses successfully', () => {
      const result = rulePrefixGroupContract.parse({
        prefix: 'other',
        names: [],
      });

      expect(result).toStrictEqual({
        prefix: 'other',
        names: [],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing prefix} => throws validation error', () => {
      expect(() => {
        return rulePrefixGroupContract.parse({
          names: ['ban-primitives'],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing names} => throws validation error', () => {
      expect(() => {
        return rulePrefixGroupContract.parse({
          prefix: 'ban',
        });
      }).toThrow(/Required/u);
    });
  });
});
