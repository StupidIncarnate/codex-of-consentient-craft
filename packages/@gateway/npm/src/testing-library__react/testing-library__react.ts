/**
 * PURPOSE: Gateway entry for the npm package '@testing-library/react'. Every export passes
 * through except `render`, which this subpath overrides with OUR version wrapped in
 * MantineProvider — see `./render/render`.
 *
 * USAGE:
 * import { render, renderHook, screen } from '#gateway/npm/testing-library__react';
 */

export * from '@testing-library/react';
export { render } from './render/render';
