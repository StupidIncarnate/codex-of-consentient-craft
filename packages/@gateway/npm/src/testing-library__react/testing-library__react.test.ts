import * as ourModule from './testing-library__react';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('@testing-library/react');
import { render } from './render/render';

const OVERRIDDEN_NAME = 'render';

describe('#gateway/npm/testing-library__react', () => {
  it('VALID: {module} => re-exports every @testing-library/react export except the overridden name', () => {
    const ourKeys = Object.keys(ourModule)
      .filter((key) => key !== OVERRIDDEN_NAME)
      .sort();
    const pkgKeys = Object.keys(pkgModule)
      .filter((key) => key !== OVERRIDDEN_NAME)
      .sort();

    expect(ourKeys).toStrictEqual(pkgKeys);
  });

  it('VALID: {module} => overrides render with our own MantineProvider-wrapped version', () => {
    expect(ourModule.render).toBe(render);
  });
});
