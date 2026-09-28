import * as ourModule from './jest__globals';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which the real @jest/globals interception does — comparing
// against that synthetic shape would fail the key comparison below. `import x = require(...)`
// compiles straight to `require(...)`, so pkgModule is the real intercepted globals object.
import pkgModule = require('@jest/globals');

const CURATED_WRAPPER_NAMES = [
  'spyOn',
  'doMock',
  'requireActual',
  'isolateModulesAsync',
  'resetModules',
  'fn',
] as const;

describe('#gateway/npm/jest__globals', () => {
  it('VALID: {barrel} => re-exports every real @jest/globals key, plus the curated wrapper names', () => {
    const ourKeys = Object.keys(ourModule).sort();
    const expectedKeys = [...Object.keys(pkgModule), ...CURATED_WRAPPER_NAMES].sort();

    expect(ourKeys).toStrictEqual(expectedKeys);
  });

  it('VALID: {barrel} => the curated wrapper names are real functions', () => {
    expect({
      spyOn: ourModule.spyOn,
      doMock: ourModule.doMock,
      requireActual: ourModule.requireActual,
      isolateModulesAsync: ourModule.isolateModulesAsync,
      resetModules: ourModule.resetModules,
      fn: ourModule.fn,
    }).toStrictEqual({
      spyOn: expect.any(Function),
      doMock: expect.any(Function),
      requireActual: expect.any(Function),
      isolateModulesAsync: expect.any(Function),
      resetModules: expect.any(Function),
      fn: expect.any(Function),
    });
  });

  it('VALID: {barrel} => jest itself passes through, still exposing spyOn from the real @jest/globals binding', () => {
    expect(ourModule.jest.spyOn).toStrictEqual(expect.any(Function));
  });
});
