import * as ourModule from './index';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('pngjs');

const ADDED_NAME = 'decodePng';

describe('@dungeonmaster/npm/pngjs', () => {
  it('VALID: {module} => re-exports every pngjs export, plus our own decodePng', () => {
    const ourKeys = Object.keys(ourModule)
      .filter((key) => key !== ADDED_NAME)
      .sort();

    expect(ourKeys).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
