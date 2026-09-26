/**
 * @jest-environment jsdom
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { useMantineTheme } from '@mantine/core';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { render } from './render';
import { renderProxy } from './render.proxy';

const ThemePrimaryColorWidget = (): ReactElement =>
  createElement('div', { 'data-testid': 'THEME_PRIMARY_COLOR' }, useMantineTheme().primaryColor);

describe('render', () => {
  it('VALID: {ui: a component reading Mantine context} => renders it inside MantineProvider', () => {
    renderProxy();

    render(createElement(ThemePrimaryColorWidget));

    expect(screen.getByTestId('THEME_PRIMARY_COLOR')).toBeInTheDocument();
    expect(screen.getByTestId('THEME_PRIMARY_COLOR').textContent).toBe('blue');
  });

  it('VALID: {options: a custom container} => still passes other RenderOptions through', () => {
    renderProxy();
    const container = document.body.appendChild(document.createElement('div'));

    const result = render(createElement('div', { 'data-testid': 'IN_CUSTOM_CONTAINER' }, 'hi'), {
      container,
    });

    expect(result.container).toBe(container);
  });
});
