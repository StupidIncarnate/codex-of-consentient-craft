import { AppHealthResponderProxy } from './app-health-responder.proxy';
import { AppHealthResponder } from './app-health-responder';

describe('AppHealthResponder', () => {
  describe('export', () => {
    it('VALID: => is a function', () => {
      AppHealthResponderProxy();

      expect(AppHealthResponder).toStrictEqual(expect.any(Function));
    });
  });
});
