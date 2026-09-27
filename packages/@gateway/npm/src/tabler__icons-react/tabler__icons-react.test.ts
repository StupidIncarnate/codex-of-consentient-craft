import * as ourModule from './tabler__icons-react';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('@tabler/icons-react');

describe('#gateway/npm/tabler__icons-react', () => {
  it('VALID: {module} => re-exports the same runtime bindings as @tabler/icons-react', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
