import { AppFlow } from './app-flow';

describe('AppFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports AppFlow function', () => {
      expect(typeof AppFlow).toBe('function');
    });
  });
});
