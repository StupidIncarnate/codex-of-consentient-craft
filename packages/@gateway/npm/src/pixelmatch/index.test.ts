import * as ourModule from './index';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('pixelmatch');

describe('@dungeonmaster/npm/pixelmatch', () => {
  // pixelmatch's own module.exports carries no property besides the function itself — there is
  // no separate named export to compare, so the default is the only real value this package has.
  it("VALID: {module} => default export is pixelmatch's own module value", () => {
    expect(ourModule.default).toBe(pkgModule);
  });
});
