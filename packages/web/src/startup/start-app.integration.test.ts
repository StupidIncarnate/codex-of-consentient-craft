import { StartApp } from './start-app';

describe('StartApp', () => {
  describe('export', () => {
    it('VALID: {} => exports StartApp function', () => {
      expect(typeof StartApp).toBe('function');
    });
  });
});
