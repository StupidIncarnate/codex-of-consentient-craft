import { testingLibraryActAdapter } from './testing-library-act-adapter';
import { testingLibraryActAdapterProxy } from './testing-library-act-adapter.proxy';

describe('testingLibraryActAdapter', () => {
  describe('act wrapper', () => {
    it('VALID: {callback} => executes callback within act', () => {
      testingLibraryActAdapterProxy();
      let executed = false;

      testingLibraryActAdapter({
        callback: () => {
          executed = true;
        },
      });

      expect(executed).toBe(true);
    });
  });
});
