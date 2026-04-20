import { ServerInitResponderProxy } from './server-init-responder.proxy';

describe('ServerInitResponder', () => {
  describe('successful initialization', () => {
    it('VALID: {default state} => completes initialization without error', async () => {
      const proxy = ServerInitResponderProxy();

      await expect(proxy.callResponder()).resolves.toStrictEqual({ success: true });
    });
  });
});
