import * as ourModule from './hono__node-server';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('@hono/node-server');
import { serve } from './server/server';

const OVERRIDDEN_NAME = 'serve';

describe('#gateway/npm/hono__node-server', () => {
  it('VALID: {module} => re-exports every @hono/node-server export except the overridden name', () => {
    const ourKeys = Object.keys(ourModule)
      .filter((key) => key !== OVERRIDDEN_NAME)
      .sort();
    const pkgKeys = Object.keys(pkgModule)
      .filter((key) => key !== OVERRIDDEN_NAME)
      .sort();

    expect(ourKeys).toStrictEqual(pkgKeys);
  });

  it('VALID: {module} => overrides serve with our own guarded wrapper', () => {
    expect(ourModule.serve).toBe(serve);
  });
});
