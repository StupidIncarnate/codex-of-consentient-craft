import { AppMountResponderProxy } from './app-mount-responder.proxy';

describe('AppMountResponder', () => {
  describe('mounting', () => {
    it('VALID: {content} => calls adapter to render content', () => {
      const proxy = AppMountResponderProxy();
      proxy.setupRootElement();

      proxy.callResponder({ content: 'test-content' });

      expect(proxy.renderWasCalled()).toBe(true);
    });
  });
});
