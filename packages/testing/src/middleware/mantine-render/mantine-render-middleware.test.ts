/**
 * @jest-environment jsdom
 */
import { useMantineTheme } from '#gateway/npm/mantine__core';
import { createElement } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import '#gateway/npm/testing-library__jest-dom';
import { screen } from '#gateway/npm/testing-library__react';
import { mantineRenderMiddleware } from './mantine-render-middleware';
import { mantineRenderMiddlewareProxy } from './mantine-render-middleware.proxy';

const ThemePrimaryColorWidget = (): ReactElement =>
  createElement('div', { 'data-testid': 'THEME_PRIMARY_COLOR' }, useMantineTheme().primaryColor);

describe('mantineRenderMiddleware', () => {
  it('VALID: {ui: a component reading Mantine context} => renders it inside MantineProvider', () => {
    mantineRenderMiddlewareProxy();

    mantineRenderMiddleware({ ui: createElement(ThemePrimaryColorWidget) });

    expect(screen.getByTestId('THEME_PRIMARY_COLOR')).toBeInTheDocument();
    expect(screen.getByTestId('THEME_PRIMARY_COLOR').textContent).toBe('blue');
  });

  it('VALID: {options: a custom container} => still passes other RenderOptions through', () => {
    mantineRenderMiddlewareProxy();
    const container = document.body.appendChild(document.createElement('div'));

    const result = mantineRenderMiddleware({
      ui: createElement('div', { 'data-testid': 'IN_CUSTOM_CONTAINER' }, 'hi'),
      options: { container },
    });

    expect(result.container).toBe(container);
  });
});
