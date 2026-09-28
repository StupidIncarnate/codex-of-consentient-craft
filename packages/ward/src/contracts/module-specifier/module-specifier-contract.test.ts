import { moduleSpecifierContract } from './module-specifier-contract';
import { ModuleSpecifierStub } from './module-specifier.stub';

describe('moduleSpecifierContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "@dungeonmaster/node/fs"} => parses successfully', () => {
      const result = moduleSpecifierContract.parse(ModuleSpecifierStub());

      expect(result).toBe('@dungeonmaster/node/fs');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => moduleSpecifierContract.parse('')).toThrow(/>=1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a gateway specifier', () => {
      const result = ModuleSpecifierStub();

      expect(result).toBe('@dungeonmaster/node/fs');
    });
  });
});
