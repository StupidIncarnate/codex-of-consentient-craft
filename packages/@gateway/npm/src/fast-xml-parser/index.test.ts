import * as ourModule from './index';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('fast-xml-parser');

const ADDED_NAME = 'parseXml';

describe('@dungeonmaster/npm/fast-xml-parser', () => {
  it('VALID: {module} => re-exports every fast-xml-parser export, plus our own parseXml', () => {
    const ourKeys = Object.keys(ourModule)
      .filter((key) => key !== ADDED_NAME)
      .sort();

    expect(ourKeys).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
