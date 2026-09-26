import { objectPropertyValueTransformer } from './object-property-value-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('objectPropertyValueTransformer', () => {
  describe('matching property', () => {
    it('VALID: {properties: [command: "git"], name: "command"} => returns the value node', () => {
      const valueNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' });
      const properties = [
        TsestreeStub({
          type: TsestreeNodeType.Property,
          computed: false,
          key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
          value: valueNode,
        }),
      ];

      const result = objectPropertyValueTransformer({ properties, name: 'command' });

      expect(result).toStrictEqual(valueNode);
    });
  });

  describe('no matching property', () => {
    it('EMPTY: {properties: [], name: "command"} => returns undefined', () => {
      expect(objectPropertyValueTransformer({ properties: [], name: 'command' })).toBe(undefined);
    });

    it('INVALID: {properties: [args: []], name: "command"} => returns undefined', () => {
      const properties = [
        TsestreeStub({
          type: TsestreeNodeType.Property,
          computed: false,
          key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'args' }),
          value: TsestreeStub({ type: TsestreeNodeType.ArrayExpression, elements: [] }),
        }),
      ];

      expect(objectPropertyValueTransformer({ properties, name: 'command' })).toBe(undefined);
    });
  });
});
