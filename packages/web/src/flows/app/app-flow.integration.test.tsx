import { AppFlow } from './app-flow';

describe('AppFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports AppFlow function', () => {
      expect(AppFlow).toStrictEqual(expect.any(Function));
    });
  });
});
