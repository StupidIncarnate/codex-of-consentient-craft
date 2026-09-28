/**
 * @jest-environment jsdom
 */
// BLOCKED on a jest.config.js change outside this item's permitted scope (see G13's DECISIONS):
// `packages/testing/jest.config.js` carries no `setupFiles` entry, so this file's own jsdom
// environment reaches `setupFilesAfterEnv`'s `start-endpoint-mock-setup.ts` with no `Response`
// global — `import { setupServer } from 'msw/node'` needs it at import time
// (`@mswjs/interceptors/src/utils/fetchUtils.ts`), before this test file's own code runs, so a
// polyfill written here arrives too late. `packages/@gateway/npm/jest.config.js` solves the
// identical gap for a jsdom-environment file via
// `setupFiles: [...baseConfig.setupFiles, '@dungeonmaster/testing/jsdom-polyfills']`.
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { useMantineTheme } from '@mantine/core';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { mantineRenderAdapter } from './mantine-render-adapter';
import { mantineRenderAdapterProxy } from './mantine-render-adapter.proxy';

const ThemePrimaryColorWidget = (): ReactElement =>
  createElement('div', { 'data-testid': 'THEME_PRIMARY_COLOR' }, useMantineTheme().primaryColor);

describe('mantineRenderAdapter', () => {
  it('VALID: {ui: a component reading Mantine context} => renders it inside MantineProvider', () => {
    mantineRenderAdapterProxy();

    mantineRenderAdapter({ ui: createElement(ThemePrimaryColorWidget) });

    expect(screen.getByTestId('THEME_PRIMARY_COLOR')).toBeInTheDocument();
    expect(screen.getByTestId('THEME_PRIMARY_COLOR').textContent).toBe('blue');
  });

  it('VALID: {options: a custom container} => still passes other RenderOptions through', () => {
    mantineRenderAdapterProxy();
    const container = document.body.appendChild(document.createElement('div'));

    const result = mantineRenderAdapter({
      ui: createElement('div', { 'data-testid': 'IN_CUSTOM_CONTAINER' }, 'hi'),
      options: { container },
    });

    expect(result.container).toBe(container);
  });
});
