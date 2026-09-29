/**
 * PURPOSE: Renders a React element for a widget test inside Mantine's own `MantineProvider`, with no
 * theme prop. The gateway's raw `render` (`#gateway/npm/testing-library__react`) carries no provider;
 * the Mantine choice is web's own, so it lives here in test infrastructure rather than in the
 * gateway every package reaches through. A `gateway.restrictedTo` entry in `.dungeonmaster.json`
 * confines the raw `render` export to this package for exactly that reason.
 *
 * USAGE:
 * mantineRenderMiddleware({ ui: <MyWidget /> });
 * // Returns a RenderResult, MyWidget rendered inside MantineProvider
 */
import { MantineProvider } from '#gateway/npm/mantine__core';
import type { ReactElement } from '#gateway/npm/react';
import { render } from '#gateway/npm/testing-library__react';
import type { RenderOptions, RenderResult } from '#gateway/npm/testing-library__react';

export const mantineRenderMiddleware = ({
  ui,
  options,
}: {
  ui: ReactElement;
  options?: RenderOptions;
}): RenderResult => render(ui, { wrapper: MantineProvider, ...options });
