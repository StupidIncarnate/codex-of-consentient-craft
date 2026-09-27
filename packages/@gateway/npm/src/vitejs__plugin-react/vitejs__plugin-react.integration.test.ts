import * as ourModule from './vitejs__plugin-react';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
// `.integration.test.ts`, not `.test.ts`: loading `@vitejs/plugin-react` for real trips the
// unit-test I/O trap (ward's `unit` check refuses a file that reaches outside the process at
// import time).
import pkgModule = require('@vitejs/plugin-react');

describe('#gateway/npm/vitejs__plugin-react', () => {
  it('VALID: {module} => re-exports the same runtime bindings as @vitejs/plugin-react', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
