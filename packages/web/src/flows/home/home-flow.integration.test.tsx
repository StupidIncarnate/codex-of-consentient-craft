import { HomeFlow } from './home-flow';

describe('HomeFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports HomeFlow function', () => {
      expect(HomeFlow).toStrictEqual(expect.any(Function));
    });
  });
});
