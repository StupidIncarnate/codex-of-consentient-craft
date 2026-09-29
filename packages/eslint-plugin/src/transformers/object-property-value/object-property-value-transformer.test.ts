import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { objectPropertyValueTransformer } from './object-property-value-transformer';

describe('objectPropertyValueTransformer', () => {
  describe('matching property', () => {
    it('VALID: {properties: [command: "git"], name: "command"} => returns the value node', () => {
      const code = 'const o = { command: "git" };';
      const properties = [PropertyStub({ code })];

      const result = objectPropertyValueTransformer({ properties, name: 'command' });

      expect(result).toStrictEqual(LiteralStub({ code }));
    });
  });

  describe('no matching property', () => {
    it('EMPTY: {properties: [], name: "command"} => returns undefined', () => {
      expect(objectPropertyValueTransformer({ properties: [], name: 'command' })).toBe(undefined);
    });

    it('INVALID: {properties: [args: []], name: "command"} => returns undefined', () => {
      const properties = [PropertyStub({ code: 'const o = { args: [] };' })];

      expect(objectPropertyValueTransformer({ properties, name: 'command' })).toBe(undefined);
    });
  });
});
