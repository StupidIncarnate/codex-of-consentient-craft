import * as ourModule from './semver';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('semver');

describe('#gateway/npm/semver', () => {
  it('VALID: {module} => re-exports the same runtime bindings as semver', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });

  it('VALID: {satisfies} => is the real semver satisfies', () => {
    expect(ourModule.satisfies).toBe(pkgModule.satisfies);
  });
});
