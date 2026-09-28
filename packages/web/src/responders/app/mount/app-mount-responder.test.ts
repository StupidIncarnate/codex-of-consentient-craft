import { waitFor } from '#gateway/npm/testing-library__react';

import { AppMountResponderProxy } from './app-mount-responder.proxy';

describe('AppMountResponder', () => {
  describe('mounting', () => {
    it('VALID: {content} => renders content inside AppRootWidget in #root and returns success', async () => {
      const proxy = AppMountResponderProxy();
      proxy.setupRootElement();

      const result = proxy.callResponder({ content: 'test-content' });

      await waitFor(() => {
        expect(proxy.isMountedInsideAppRoot()).toBe(true);
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
