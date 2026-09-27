import * as ourModule from './buffer';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which every Node built-in does — comparing against that
// synthetic shape would fail the pass-through. `import x = require(...)` compiles straight to
// `require(...)`, so pkgModule is the module's own real runtime shape.
import pkgModule = require('buffer');

describe('#gateway/node/buffer', () => {
  it('VALID: {module} => re-exports the same runtime bindings as buffer, including the Buffer global', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });

  it('VALID: {Buffer export} => is the same constructor Node provides on globalThis', () => {
    expect(ourModule.Buffer).toBe(globalThis.Buffer);
  });
});
