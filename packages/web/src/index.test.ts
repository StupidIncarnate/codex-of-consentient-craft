import { StartApp } from './index';

describe('@dungeonmaster/web', () => {
  describe('exports', () => {
    it('VALID: {} => exports StartApp', () => {
      expect(typeof StartApp).toBe('function');
    });
  });
});
