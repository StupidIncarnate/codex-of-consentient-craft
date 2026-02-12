import { testingLibraryWaitForAdapter } from './testing-library-wait-for-adapter';
import { testingLibraryWaitForAdapterProxy } from './testing-library-wait-for-adapter.proxy';

describe('testingLibraryWaitForAdapter', () => {
  describe('wait for callback', () => {
    it('VALID: {callback resolves} => completes without error', async () => {
      testingLibraryWaitForAdapterProxy();

      let called = false;

      await testingLibraryWaitForAdapter({
        callback: () => {
          called = true;
        },
      });

      expect(called).toBe(true);
    });
  });
});
