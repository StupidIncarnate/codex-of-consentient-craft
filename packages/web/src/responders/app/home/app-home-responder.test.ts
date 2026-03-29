import { AppHomeResponderProxy } from './app-home-responder.proxy';
import { AppHomeResponder } from './app-home-responder';

describe('AppHomeResponder', () => {
  describe('export', () => {
    it('VALID: => is a function', () => {
      AppHomeResponderProxy();

      expect(AppHomeResponder).toStrictEqual(expect.any(Function));
    });
  });
});
