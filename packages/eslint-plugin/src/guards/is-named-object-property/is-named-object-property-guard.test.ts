import { isNamedObjectPropertyGuard } from './is-named-object-property-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('isNamedObjectPropertyGuard', () => {
  describe('matching property', () => {
    it('VALID: {property: command: "git", name: "command"} => returns true', () => {
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        computed: false,
        key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
        value: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' }),
      });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(true);
    });
  });

  describe('non-matching property', () => {
    it('INVALID: {property: args: [], name: "command"} => returns false', () => {
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        computed: false,
        key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'args' }),
        value: TsestreeStub({ type: TsestreeNodeType.ArrayExpression, elements: [] }),
      });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(false);
    });

    it('EDGE: {property: computed [command]: "git", name: "command"} => returns false', () => {
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        computed: true,
        key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
        value: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' }),
      });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(false);
    });

    it('INVALID: {property: a non-Property node} => returns false', () => {
      const property = TsestreeStub({ type: TsestreeNodeType.SpreadElement });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {property: undefined} => returns false', () => {
      expect(isNamedObjectPropertyGuard({ name: 'command' })).toBe(false);
    });

    it('EMPTY: {name: undefined} => returns false', () => {
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        computed: false,
        key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
        value: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' }),
      });

      expect(isNamedObjectPropertyGuard({ property })).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      expect(isNamedObjectPropertyGuard({})).toBe(false);
    });
  });
});
