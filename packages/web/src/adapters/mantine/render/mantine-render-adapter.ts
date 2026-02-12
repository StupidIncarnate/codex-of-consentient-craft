/**
 * PURPOSE: Wraps @testing-library/react render with MantineProvider for component testing
 *
 * USAGE:
 * mantineRenderAdapter({ui: <MyWidget />});
 * // Returns RenderResult from @testing-library/react
 */
import type { RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

export const mantineRenderAdapter = ({ ui }: { ui: React.ReactElement }): RenderResult =>
  render(ui, { wrapper: MantineProvider });
