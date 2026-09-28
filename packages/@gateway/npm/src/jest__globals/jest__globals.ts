/**
 * PURPOSE: Curated entry for Jest's own mocking API — `@jest/globals`'s `jest` object. Named
 * wrappers cover the members `packages/testing`'s adapters actually call
 * (spyOn/doMock/requireActual/isolateModulesAsync/resetModules/fn); everything else
 * `@jest/globals` exports (`expect`, `describe`, `it`, and the rest of the test-file globals)
 * passes through unmodified, since none of it needs a wrapper of its own. `@jest/globals`'s real
 * module throws when required outside a running Jest test — this subpath inherits that, and only
 * ever loads from inside one.
 *
 * USAGE:
 * import { spyOn, doMock, requireActual, isolateModulesAsync, resetModules, fn } from '#gateway/npm/jest__globals';
 */

export * from '@jest/globals';
export { spyOn } from './spy-on/spy-on';
export { doMock } from './do-mock/do-mock';
export { requireActual } from './require-actual/require-actual';
export { isolateModulesAsync } from './isolate-modules-async/isolate-modules-async';
export { resetModules } from './reset-modules/reset-modules';
export { fn } from './fn/fn';
