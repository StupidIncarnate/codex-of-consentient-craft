import React from 'react';
import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from './mantine-render-adapter';
import { mantineRenderAdapterProxy } from './mantine-render-adapter.proxy';

describe('mantineRenderAdapter', () => {
  describe('render with MantineProvider', () => {
    it('VALID: {ui: simple element} => renders element within MantineProvider', () => {
      mantineRenderAdapterProxy();

      mantineRenderAdapter({
        ui: React.createElement('div', { 'data-testid': 'TEST_ELEMENT' }, 'Hello'),
      });

      expect(screen.getByTestId('TEST_ELEMENT')).toBeInTheDocument();
    });

    it('VALID: {ui: element} => returns render result', () => {
      mantineRenderAdapterProxy();

      const result = mantineRenderAdapter({
        ui: React.createElement('div', null, 'Content'),
      });

      expect(result.container).toBeInstanceOf(HTMLElement);
    });
  });
});
