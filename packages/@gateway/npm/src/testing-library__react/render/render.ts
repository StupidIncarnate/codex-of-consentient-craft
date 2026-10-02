/**
 * PURPOSE: OUR `render`, wrapping the rendered tree in Mantine's own `MantineProvider` with no
 * theme prop. Supports both the standard positional `(ui, options?)` and the repo-standard named
 * `{ ui, options? }` object parameter shape. Options merge onto the wrapper rather than replacing
 * it, so a caller can still extend `RenderOptions` without losing MantineProvider.
 *
 * USAGE:
 * render(<MyWidget />);
 * render({ ui: <MyWidget /> });
 * // Returns a RenderResult, MyWidget rendered inside MantineProvider
 */
import { isValidElement } from 'react';
import type { ReactElement } from 'react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render as testingLibraryRender } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

export const render = (
  uiOrParams: ReactElement | { ui: ReactElement; options?: RenderOptions },
  maybeOptions?: RenderOptions,
): RenderResult => {
  if (isValidElement(uiOrParams)) {
    return testingLibraryRender(uiOrParams, { wrapper: MantineProvider, ...maybeOptions });
  }

  const { ui, options } = uiOrParams;
  return testingLibraryRender(ui, { wrapper: MantineProvider, ...options });
};
