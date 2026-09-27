/**
 * @jest-environment jsdom
 *
 * `@testing-library/user-event`'s own default export reads `navigator` at property-access time
 * to detect the platform (Windows vs. not), so even comparing its export KEYS under Jest's
 * default `node` environment throws `Cannot read properties of undefined (reading 'navigator')`.
 */
import * as ourModule from './testing-library__user-event';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
// `.integration.test.ts`, not `.test.ts`: loading `@testing-library/user-event` for real trips
// the unit-test I/O trap (ward's `unit` check refuses a file that reaches outside the process at
// import time).
import pkgModule = require('@testing-library/user-event');

describe('#gateway/npm/testing-library__user-event', () => {
  it('VALID: {module} => re-exports the same runtime bindings as @testing-library/user-event', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
