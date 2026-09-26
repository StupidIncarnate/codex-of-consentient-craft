import * as ourModule from './index';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which every Node built-in does — comparing against that
// synthetic shape would fail the pass-through. `import x = require(...)` compiles straight to
// `require(...)`, so pkgModule is the module's own real runtime shape.
import pkgModule = require('util/types');

describe('@dungeonmaster/node/util/types', () => {
  it('VALID: {module} => re-exports the same runtime bindings as util/types', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
