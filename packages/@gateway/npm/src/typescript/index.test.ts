import * as ourModule from './index';
import ourDefault from './index';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('typescript');

describe('@dungeonmaster/npm/typescript', () => {
  it('VALID: {module} => re-exports SyntaxKind as the real typescript value', () => {
    expect(ourModule.SyntaxKind).toBe(pkgModule.SyntaxKind);
  });

  it("VALID: {module} => default export is typescript's own module value", () => {
    // A namespace import's declared TYPE never carries a synthetic `.default` (`ourModule.default`
    // does not typecheck even against `typescript` itself) even though esModuleInterop's runtime
    // `__importStar` helper does set one — only a DEFAULT import gets the synthetic default typed.
    expect(ourDefault).toBe(pkgModule);
  });
});
