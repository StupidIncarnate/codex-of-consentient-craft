import { AppLayoutResponderProxy } from './app-layout-responder.proxy';
import { AppLayoutResponder } from './app-layout-responder';

describe('AppLayoutResponder', () => {
  describe('export', () => {
    it('VALID: => is a function', () => {
      AppLayoutResponderProxy();

      expect(typeof AppLayoutResponder).toBe('function');
    });
  });
});
