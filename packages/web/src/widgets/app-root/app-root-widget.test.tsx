import { render, screen } from '@testing-library/react';

import { AppRootWidget } from './app-root-widget';
import { AppRootWidgetProxy } from './app-root-widget.proxy';

describe('AppRootWidget', () => {
  describe('rendering', () => {
    it('VALID: {children} => renders children within provider tree', () => {
      AppRootWidgetProxy();

      render(
        <AppRootWidget>
          <span data-testid="CHILD_ELEMENT">Test Content</span>
        </AppRootWidget>,
      );

      expect(screen.getByTestId('CHILD_ELEMENT')).toBeInTheDocument();
    });

    it('VALID: {children} => applies dark background color from theme statics', () => {
      AppRootWidgetProxy();

      render(
        <AppRootWidget>
          <span>Content</span>
        </AppRootWidget>,
      );

      const bgDiv = screen.getByTestId('APP_ROOT_BG');

      expect(bgDiv.style.backgroundColor).toBe('rgb(13, 9, 7)');
    });

    it('VALID: {children} => applies min-height of 100vh', () => {
      AppRootWidgetProxy();

      render(
        <AppRootWidget>
          <span>Content</span>
        </AppRootWidget>,
      );

      const bgDiv = screen.getByTestId('APP_ROOT_BG');

      expect(bgDiv.style.minHeight).toBe('100vh');
    });
  });
});
