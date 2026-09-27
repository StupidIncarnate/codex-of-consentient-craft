import * as ourModule from './typescript-eslint__eslint-plugin';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('@typescript-eslint/eslint-plugin');

describe('#gateway/npm/typescript-eslint__eslint-plugin', () => {
  it('VALID: {module} => re-exports rules as the real @typescript-eslint/eslint-plugin value', () => {
    expect(ourModule.rules).toBe(pkgModule.rules);
  });

  it("VALID: {module} => default export is @typescript-eslint/eslint-plugin's own module value", () => {
    expect(ourModule.default).toBe(pkgModule);
  });
});
