import { Text } from 'ink';
import React from 'react';

import { inkTestingLibraryRenderAdapter } from './ink-testing-library-render-adapter';
import { inkTestingLibraryRenderAdapterProxy } from './ink-testing-library-render-adapter.proxy';

describe('inkTestingLibraryRenderAdapter', () => {
  describe('rendering', () => {
    it('VALID: {element: Ink element} => returns render result with lastFrame', () => {
      inkTestingLibraryRenderAdapterProxy();

      const element = React.createElement(Text, null, 'Hello');
      const result = inkTestingLibraryRenderAdapter({ element });

      expect(result.lastFrame()).toMatch(/Hello/u);
    });

    it('VALID: {element: Ink element} => returns render result with stdin', () => {
      inkTestingLibraryRenderAdapterProxy();

      const element = React.createElement(Text, null, 'Hello');
      const result = inkTestingLibraryRenderAdapter({ element });

      expect(result.stdin).toBeDefined();
      expect(typeof result.stdin.write).toBe('function');
    });
  });
});
