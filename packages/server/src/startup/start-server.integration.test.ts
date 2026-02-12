import { StartServer } from './start-server';

describe('StartServer', () => {
  describe('server initialization', () => {
    it('VALID: {} => exports StartServer function', () => {
      expect(typeof StartServer).toBe('function');
    });
  });
});
