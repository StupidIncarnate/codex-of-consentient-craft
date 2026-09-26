/**
 * PURPOSE: OUR `render`, wrapping the rendered tree in Mantine's own `MantineProvider` with no
 * theme prop — matching `packages/web/src/adapters/mantine/render/mantine-render-adapter.ts`
 * verbatim, confirmed against `packages/web/src/widgets/logo/logo-widget.test.tsx`, which is every
 * web widget test's own render path today. The gateway cannot import web's code (web's own theme
 * lives in a widget), so this wraps with bare `MantineProvider` rather than reaching for a theme
 * that isn't the gateway's to import; a caller needing a different theme passes its own
 * `options.wrapper` to override this one. Keeps the raw `render` name and its `(ui, options?)`
 * shape; options merge onto the wrapper rather than replacing it, so a caller can still extend
 * `RenderOptions` without losing MantineProvider.
 *
 * USAGE:
 * render(reactCreateElement(MyWidget));
 * // Returns a RenderResult, MyWidget rendered inside MantineProvider
 */
import type { ReactElement } from 'react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render as testingLibraryRender } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

export const render = (ui: ReactElement, options?: RenderOptions): RenderResult =>
  testingLibraryRender(ui, { wrapper: MantineProvider, ...options });
