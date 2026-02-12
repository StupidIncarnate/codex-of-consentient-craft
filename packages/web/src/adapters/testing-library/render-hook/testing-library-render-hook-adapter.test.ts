import { useState } from 'react';

import { testingLibraryRenderHookAdapter } from './testing-library-render-hook-adapter';
import { testingLibraryRenderHookAdapterProxy } from './testing-library-render-hook-adapter.proxy';

describe('testingLibraryRenderHookAdapter', () => {
  describe('render hook', () => {
    it('VALID: {renderCallback} => renders hook and returns result', () => {
      testingLibraryRenderHookAdapterProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useState(42),
      });

      expect(result.current[0]).toBe(42);
    });
  });
});
