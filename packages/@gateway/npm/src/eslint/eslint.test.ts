import * as ourModule from './eslint';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('eslint');

describe('#gateway/npm/eslint', () => {
  it('VALID: {module} => re-exports the same runtime bindings as eslint', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });

  it('VALID: {ESLint} => extends the very class eslint exports', () => {
    expect(Object.getPrototypeOf(ourModule.ESLint)).toBe(pkgModule.ESLint);
  });
});
