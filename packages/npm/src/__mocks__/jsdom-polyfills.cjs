// jest-environment-jsdom does not put Node's setImmediate/clearImmediate on globalThis.
// @dungeonmaster/testing's open-handle leak tracker (jest.setup.js) reads
// `globalThis.setImmediate.__promisify__` while wiring its own watcher, and an undefined
// setImmediate throws before a single test in a jsdom-environment file runs — hit by
// `@testing-library/react/render.test.ts`'s `@jest-environment jsdom` docblock. Matches
// `packages/browser/src/__mocks__/jsdom-polyfills.cjs`'s own fix for the same crash; not shared
// across packages because the gateway takes no dependency between its own packages for this.
const { setImmediate, clearImmediate } = require('node:timers');
if (typeof global.setImmediate === 'undefined') global.setImmediate = setImmediate;
if (typeof global.clearImmediate === 'undefined') global.clearImmediate = clearImmediate;
