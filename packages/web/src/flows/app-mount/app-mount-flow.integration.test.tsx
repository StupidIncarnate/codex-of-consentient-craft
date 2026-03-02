import { AppMountFlow } from './app-mount-flow';

describe('AppMountFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports AppMountFlow function', () => {
      expect(typeof AppMountFlow).toBe('function');
    });
  });
});
