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

  describe('global css', () => {
    // Two rules, both here for the same reason: neither has an element this app owns to hang an
    // inline style off. Asserted as ONE exact string rather than per-rule substrings, so a rule
    // that silently loses a declaration fails instead of still matching.
    //
    // ::selection — left undeclared the browser default applies: blue fill, and a FOREGROUND
    // recolour that leaves warm body text illegible on it. Setting only the background leaves the
    // contrast problem exactly where it was, so both halves are in the rule.
    //
    // .react-flow__attribution — the library's credit, dimmed rather than removed. `background:
    // transparent` is the load-bearing declaration: the light chip behind the text is what made it
    // the brightest object on the canvas, and recolouring the link alone changes almost nothing.
    // Nothing here hides it — no display:none, no visibility:hidden, and hover restores full
    // strength, because a credit has to stay legible and clickable to be a credit.
    it('VALID: {children} => declares palette ::selection and a dimmed React Flow attribution', () => {
      AppRootWidgetProxy();

      render(
        <AppRootWidget>
          <span>Content</span>
        </AppRootWidget>,
      );

      expect(screen.getByTestId('APP_ROOT_GLOBAL_CSS').textContent).toBe(
        '::selection { background-color: #ff6b35; color: #0d0907; }' +
          ' .react-flow__attribution { background: transparent; padding: 2px 4px; }' +
          ' .react-flow__attribution a { color: #8a7260; font-family: monospace; font-size: 9px; }' +
          ' .react-flow__attribution a:hover { color: #ff6b35; }',
      );
    });
  });
});
