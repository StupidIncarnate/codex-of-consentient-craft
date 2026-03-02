import { HomeFlow } from './home-flow';

describe('HomeFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports HomeFlow function', () => {
      expect(typeof HomeFlow).toBe('function');
    });
  });
});
