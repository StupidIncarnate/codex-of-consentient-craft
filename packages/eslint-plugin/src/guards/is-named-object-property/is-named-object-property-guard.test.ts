import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { SpreadElementStub } from '#gateway/npm/typescript-eslint__utils/spread-element/spread-element.stub';
import { isNamedObjectPropertyGuard } from './is-named-object-property-guard';

describe('isNamedObjectPropertyGuard', () => {
  describe('matching property', () => {
    it('VALID: {property: command: "git", name: "command"} => returns true', () => {
      const property = PropertyStub({ code: 'const o = { command: "git" };' });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(true);
    });
  });

  describe('non-matching property', () => {
    it('INVALID: {property: args: [], name: "command"} => returns false', () => {
      const property = PropertyStub({ code: 'const o = { args: [] };' });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(false);
    });

    it('EDGE: {property: computed [command]: "git", name: "command"} => returns false', () => {
      const property = PropertyStub({ code: 'const o = { [command]: "git" };' });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(false);
    });

    it('INVALID: {property: a non-Property node} => returns false', () => {
      const property = SpreadElementStub({ code: 'f(...x);' });

      expect(isNamedObjectPropertyGuard({ property, name: 'command' })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {property: undefined} => returns false', () => {
      expect(isNamedObjectPropertyGuard({ name: 'command' })).toBe(false);
    });

    it('EMPTY: {name: undefined} => returns false', () => {
      const property = PropertyStub({ code: 'const o = { command: "git" };' });

      expect(isNamedObjectPropertyGuard({ property })).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      expect(isNamedObjectPropertyGuard({})).toBe(false);
    });
  });
});
