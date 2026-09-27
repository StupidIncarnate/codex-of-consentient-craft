/**
 * PURPOSE: Wraps the gateway's raw `render` (`#gateway/npm/testing-library__react`, a plain
 * pass-through of `@testing-library/react`'s own `render`) in Mantine's own `MantineProvider`, with
 * no theme prop. The Mantine choice is web's own — the one app that renders through this — so it
 * lives here, in test infrastructure, rather than inside the gateway wrapper every package reaches
 * through. A `gateway.restrictedTo` entry in `.dungeonmaster.json` confines the gateway's raw
 * `render` export to this package for exactly that reason.
 *
 * USAGE:
 * mantineRenderAdapter({ui: reactCreateElement(MyWidget)});
 * // Returns a RenderResult, MyWidget rendered inside MantineProvider
 */
import type { ReactElement } from 'react';
import { render as gatewayRender } from '#gateway/npm/testing-library__react';
import type { RenderOptions, RenderResult } from '#gateway/npm/testing-library__react';
import { MantineProvider } from '@mantine/core';

export const mantineRenderAdapter = ({
  ui,
  options,
}: {
  ui: ReactElement;
  options?: RenderOptions;
}): RenderResult => gatewayRender(ui, { wrapper: MantineProvider, ...options });
