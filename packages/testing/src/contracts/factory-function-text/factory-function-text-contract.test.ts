import { factoryFunctionTextContract } from './factory-function-text-contract';
import { FactoryFunctionTextStub } from './factory-function-text.stub';

describe('factoryFunctionTextContract', () => {
  describe('valid factory functions', () => {
    it('VALID: {value: "() => ({})"} => parses arrow function', () => {
      const factory = FactoryFunctionTextStub({ value: '() => ({})' });

      const result = factoryFunctionTextContract.parse(factory);

      expect(result).toBe('() => ({})');
    });

    it('VALID: {value: "() => ({ get: jest.fn() })"} => parses with methods', () => {
      const factory = FactoryFunctionTextStub({ value: '() => ({ get: jest.fn() })' });

      const result = factoryFunctionTextContract.parse(factory);

      expect(result).toBe('() => ({ get: jest.fn() })');
    });

    it('VALID: {value: "function() { return {}; }"} => parses function expression', () => {
      const factory = FactoryFunctionTextStub({ value: 'function() { return {}; }' });

      const result = factoryFunctionTextContract.parse(factory);

      expect(result).toBe('function() { return {}; }');
    });

    it('VALID: {value: multiline factory} => parses multiline', () => {
      const factoryText = `() => ({
  get: jest.fn(),
  post: jest.fn()
})`;
      const factory = FactoryFunctionTextStub({ value: factoryText });

      const result = factoryFunctionTextContract.parse(factory);

      expect(result).toBe(factoryText);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: empty string} => parses empty string', () => {
      const factory = FactoryFunctionTextStub({ value: '' });

      const result = factoryFunctionTextContract.parse(factory);

      expect(result).toBe('');
    });
  });
});
