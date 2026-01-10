/**
 * PURPOSE: Wraps ink-testing-library render function for testing CLI widgets
 *
 * USAGE:
 * const { lastFrame, stdin } = inkTestingLibraryRenderAdapter({ element: <MyWidget /> });
 * stdin.write('q');
 * expect(lastFrame()).toMatch(/expected text/u);
 */
import type { ReactElement } from 'react';
import { render } from 'ink-testing-library';

export type InkRenderResult = ReturnType<typeof render>;

export const inkTestingLibraryRenderAdapter = ({
  element,
}: {
  element: ReactElement;
}): InkRenderResult => render(element);
