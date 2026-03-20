/**
 * Tests for register-mock subpath barrel exports
 */

import { registerMock } from './register-mock';

describe('register-mock barrel exports', () => {
  describe('registerMock', () => {
    it('VALID: exports registerMock => is defined as function', () => {
      expect(registerMock).toBeDefined();
      expect(typeof registerMock).toBe('function');
    });
  });
});
