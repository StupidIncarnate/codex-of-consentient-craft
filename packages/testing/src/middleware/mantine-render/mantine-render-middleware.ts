/**
 * PURPOSE: Compatibility re-export for `render` from `#gateway/npm/testing-library__react`,
 * which wraps rendered elements in Mantine's own `MantineProvider`.
 *
 * USAGE:
 * mantineRenderMiddleware({ ui: <MyWidget /> });
 * // Returns a RenderResult, MyWidget rendered inside MantineProvider
 */
import { render } from '#gateway/npm/testing-library__react';

export const mantineRenderMiddleware = render;
