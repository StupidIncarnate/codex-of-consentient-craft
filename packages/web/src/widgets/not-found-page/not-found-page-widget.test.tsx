import { screen } from '#gateway/npm/testing-library__react';
import { MemoryRouter, Route, Routes } from '#gateway/npm/react-router-dom';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { NotFoundPageWidget } from './not-found-page-widget';
import { NotFoundPageWidgetProxy } from './not-found-page-widget.proxy';

const renderAt = ({ url }: { url: string }): void => {
  mantineRenderMiddleware({
    ui: (
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/" element={<span data-testid="HOME_MARKER">home</span>} />
          <Route path="*" element={<NotFoundPageWidget />} />
        </Routes>
      </MemoryRouter>
    ),
  });
};

describe('NotFoundPageWidget', () => {
  describe('unmatched path', () => {
    it('VALID: {url: /x-does-not-exist} => shows NOT FOUND, the path and a link to /', () => {
      const proxy = NotFoundPageWidgetProxy();

      renderAt({ url: '/x-does-not-exist' });

      expect(proxy.hasNotFoundPage()).toBe(true);
      expect(screen.getByTestId('NOT_FOUND_TITLE').textContent).toBe('NOT FOUND');
      expect(proxy.getShownPath()).toBe('/x-does-not-exist');
      expect(proxy.getHomeLinkHref()).toBe('/');
    });

    it('VALID: {url: /a/b/c} => shows the whole nested path', () => {
      const proxy = NotFoundPageWidgetProxy();

      renderAt({ url: '/a/b/c' });

      expect(proxy.getShownPath()).toBe('/a/b/c');
    });

    it('VALID: {click BACK TO HOME} => navigates to / and the page disappears', async () => {
      const proxy = NotFoundPageWidgetProxy();
      renderAt({ url: '/x-does-not-exist' });

      await proxy.clickHomeLink();

      expect(screen.getByTestId('HOME_MARKER').textContent).toBe('home');
      expect(proxy.hasNotFoundPage()).toBe(false);
    });
  });
});
