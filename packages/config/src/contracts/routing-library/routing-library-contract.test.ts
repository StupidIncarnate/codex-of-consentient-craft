import { routingLibraryContract } from './routing-library-contract';
import { RoutingLibraryStub } from './routing-library.stub';

describe('routingLibraryContract', () => {
  describe('valid routing libraries', () => {
    it('VALID: "react-router-dom" => parses successfully', () => {
      const library = routingLibraryContract.parse('react-router-dom');

      expect(library).toBe('react-router-dom');
    });

    it('VALID: "express" => parses successfully', () => {
      const library = routingLibraryContract.parse('express');

      expect(library).toBe('express');
    });

    it('VALID: stub with default => parses as react-router-dom', () => {
      const library = RoutingLibraryStub();

      const result = routingLibraryContract.parse(library);

      expect(result).toBe('react-router-dom');
    });

    it('VALID: stub with override => parses with custom value', () => {
      const library = RoutingLibraryStub({ value: 'vue-router' });

      const result = routingLibraryContract.parse(library);

      expect(result).toBe('vue-router');
    });
  });

  describe('invalid routing libraries', () => {
    it('INVALID_VALUE: "invalid" => throws validation error', () => {
      expect(() => {
        return routingLibraryContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_TYPE: 123 => throws validation error', () => {
      expect(() => {
        return routingLibraryContract.parse(123);
      }).toThrow(/Expected/u);
    });

    it('INVALID_UNDEFINED: undefined => throws validation error', () => {
      expect(() => {
        return routingLibraryContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
