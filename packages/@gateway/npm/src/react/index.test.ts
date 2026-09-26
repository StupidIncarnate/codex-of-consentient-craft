import * as ourModule from './index';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('react');

describe('@dungeonmaster/npm/react', () => {
  it('VALID: {module} => re-exports useState as the real react value', () => {
    expect(ourModule.useState).toBe(pkgModule.useState);
  });

  it("VALID: {module} => default export is react's own module value", () => {
    expect(ourModule.default).toBe(pkgModule);
  });
});
