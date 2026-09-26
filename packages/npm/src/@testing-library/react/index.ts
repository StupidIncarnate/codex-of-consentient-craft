/**
 * PURPOSE: Gateway entry for the npm package '@testing-library/react'. Every export passes
 * through except `render`, which this subpath overrides with OUR version wrapped in
 * MantineProvider — see `./render`. `renderHook` stays a plain pass-through: no hook in this repo
 * reads Mantine context today, matching `testingLibraryRenderHookAdapter`
 * (`packages/web/src/adapters/testing-library/render-hook/`).
 *
 * USAGE:
 * import { render, renderHook, screen } from '@dungeonmaster/npm/@testing-library/react';
 */

export * from '@testing-library/react';
export { render } from './render';
