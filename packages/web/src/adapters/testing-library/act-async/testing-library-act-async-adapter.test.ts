import { testingLibraryActAsyncAdapter } from './testing-library-act-async-adapter';
import { testingLibraryActAsyncAdapterProxy } from './testing-library-act-async-adapter.proxy';

describe('testingLibraryActAsyncAdapter', () => {
  describe('async act wrapper', () => {
    it('VALID: {async callback} => executes callback within act', async () => {
      testingLibraryActAsyncAdapterProxy();
      let executed = false;

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await Promise.resolve();
          executed = true;
        },
      });

      expect(executed).toBe(true);
    });
  });
});
