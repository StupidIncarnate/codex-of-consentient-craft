/**
 * PURPOSE: Wraps ink-testing-library render function for testing CLI widgets
 *
 * USAGE:
 * const { lastFrame, stdin } = inkTestingLibraryRenderAdapter({ element: <MyWidget /> });
 * stdin.write('q');
 * expect(lastFrame()).toMatch(/expected text/u);
 */
import type { ReactElement } from 'react';

import { inkTestRender, type InkTestRenderResult } from './ink-test-render';

export type InkRenderResult = InkTestRenderResult;

export const inkTestingLibraryRenderAdapter = ({
  element,
}: {
  element: ReactElement;
}): InkRenderResult => inkTestRender(element);
