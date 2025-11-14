import { isValidRoutingLibraryGuard } from './is-valid-routing-library-guard';

describe('isValidRoutingLibraryGuard', () => {
  describe('valid routing libraries', () => {
    it('VALID: {library: "react-router-dom"} => returns true', () => {
      const result = isValidRoutingLibraryGuard({ library: 'react-router-dom' });

      expect(result).toBe(true);
    });

    it('VALID: {library: "express"} => returns true', () => {
      const result = isValidRoutingLibraryGuard({ library: 'express' });

      expect(result).toBe(true);
    });

    it('VALID: {library: "vue-router"} => returns true', () => {
      const result = isValidRoutingLibraryGuard({ library: 'vue-router' });

      expect(result).toBe(true);
    });
  });

  describe('invalid routing libraries', () => {
    it('INVALID_VALUE: {library: "invalid"} => returns false', () => {
      const result = isValidRoutingLibraryGuard({ library: 'invalid' });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {library: 123} => returns false', () => {
      const result = isValidRoutingLibraryGuard({ library: 123 });

      expect(result).toBe(false);
    });

    it('INVALID_UNDEFINED: {library: undefined} => returns false', () => {
      const result = isValidRoutingLibraryGuard({ library: undefined });

      expect(result).toBe(false);
    });

    it('INVALID_NULL: {library: null} => returns false', () => {
      const result = isValidRoutingLibraryGuard({ library: null });

      expect(result).toBe(false);
    });
  });
});
