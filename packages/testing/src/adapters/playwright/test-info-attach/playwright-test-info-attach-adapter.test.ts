import { playwrightTestInfoAttachAdapter } from './playwright-test-info-attach-adapter';
import { playwrightTestInfoAttachAdapterProxy } from './playwright-test-info-attach-adapter.proxy';

describe('playwrightTestInfoAttachAdapter', () => {
  describe('export', () => {
    it('VALID: {adapter} => is a function', () => {
      playwrightTestInfoAttachAdapterProxy();

      expect(typeof playwrightTestInfoAttachAdapter).toBe('function');
    });
  });
});
