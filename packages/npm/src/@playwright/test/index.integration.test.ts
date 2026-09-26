import * as ourModule from './index';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
// `.integration.test.ts`, not `.test.ts`: loading `@playwright/test` for real trips the unit-test
// I/O trap (ward's `unit` check refuses a file that reaches outside the process at import time).
import pkgModule = require('@playwright/test');

describe('@dungeonmaster/npm/@playwright/test', () => {
  it('VALID: {module} => re-exports the same runtime bindings as @playwright/test', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
