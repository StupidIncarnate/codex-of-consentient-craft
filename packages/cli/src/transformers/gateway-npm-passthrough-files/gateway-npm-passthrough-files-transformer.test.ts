import { GatewayNpmDependencyStub } from '../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { NpmModuleExportShapeStub } from '../../contracts/npm-module-export-shape/npm-module-export-shape.stub';
import { gatewayNpmPassthroughFilesTransformer } from './gateway-npm-passthrough-files-transformer';

const KEY_PARITY_TEST = `import * as ourModule from './left-pad';
// A raw \`require\`, not \`import * as\`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. \`import x = require(...)\` compiles
// straight to \`require(...)\`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('left-pad');

describe('#gateway/npm/left-pad', () => {
  it('VALID: {module} => re-exports the same runtime bindings as left-pad', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
`;

const NAMED_HEADER = `/**
 * PURPOSE: Pass-through for the npm package 'left-pad'. Code outside the gateway imports left-pad
 * through here instead of the raw package, so a future guard or override on left-pad lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/left-pad';
 */
`;

describe('gatewayNpmPassthroughFilesTransformer', () => {
  it('VALID: {shape: named} => export * barrel and a key-parity test', () => {
    const dependency = GatewayNpmDependencyStub();

    const result = gatewayNpmPassthroughFilesTransformer({
      dependency,
      shape: NpmModuleExportShapeStub({ value: 'named' }),
    });

    expect(result).toStrictEqual([
      {
        relativePath: 'left-pad/left-pad.ts',
        contents: `${NAMED_HEADER}\nexport * from 'left-pad';\n`,
      },
      { relativePath: 'left-pad/left-pad.test.ts', contents: KEY_PARITY_TEST },
    ]);
  });

  it('VALID: {shape: named-and-default} => export * plus the default, and a key-parity test', () => {
    const dependency = GatewayNpmDependencyStub();

    const result = gatewayNpmPassthroughFilesTransformer({
      dependency,
      shape: NpmModuleExportShapeStub({ value: 'named-and-default' }),
    });

    expect(result).toStrictEqual([
      {
        relativePath: 'left-pad/left-pad.ts',
        contents: `${NAMED_HEADER}\nexport * from 'left-pad';\nexport { default } from 'left-pad';\n`,
      },
      { relativePath: 'left-pad/left-pad.test.ts', contents: KEY_PARITY_TEST },
    ]);
  });

  it('VALID: {shape: export-equals} => import-equals barrel and a same-object test', () => {
    const dependency = GatewayNpmDependencyStub();

    const result = gatewayNpmPassthroughFilesTransformer({
      dependency,
      shape: NpmModuleExportShapeStub({ value: 'export-equals' }),
    });

    expect(result).toStrictEqual([
      {
        relativePath: 'left-pad/left-pad.ts',
        contents: `/**
 * PURPOSE: Pass-through for the npm package 'left-pad'. Code outside the gateway imports left-pad
 * through here instead of the raw package, so a future guard or override on left-pad lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import pkg from '#gateway/npm/left-pad';
 */

import pkgModule = require('left-pad');

export = pkgModule;
`,
      },
      {
        relativePath: 'left-pad/left-pad.test.ts',
        contents: `import ourModule = require('./left-pad');
// A raw \`require\`, not \`import * as\`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. \`import x = require(...)\` compiles
// straight to \`require(...)\`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('left-pad');

describe('#gateway/npm/left-pad', () => {
  it('VALID: {module} => is the same module object as left-pad', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
`,
      },
    ]);
  });

  it('VALID: {shape: untyped, scoped package} => export * barrel naming the missing types', () => {
    const dependency = GatewayNpmDependencyStub({
      name: '@acme/untyped-lib',
      folder: 'acme__untyped-lib',
    });

    const result = gatewayNpmPassthroughFilesTransformer({
      dependency,
      shape: NpmModuleExportShapeStub({ value: 'untyped' }),
    });

    expect(result).toStrictEqual([
      {
        relativePath: 'acme__untyped-lib/acme__untyped-lib.ts',
        contents: `/**
 * PURPOSE: Pass-through for the npm package '@acme/untyped-lib'. Code outside the gateway imports @acme/untyped-lib
 * through here instead of the raw package, so a future guard or override on @acme/untyped-lib lands in
 * this one file and reaches every caller.
 *
 * '@acme/untyped-lib' resolved no type declarations when this file was generated, so every import
 * through here is untyped until the package or an @types package supplies them.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/acme__untyped-lib';
 */

export * from '@acme/untyped-lib';
`,
      },
      {
        relativePath: 'acme__untyped-lib/acme__untyped-lib.test.ts',
        contents: `import * as ourModule from './acme__untyped-lib';
// A raw \`require\`, not \`import * as\`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. \`import x = require(...)\` compiles
// straight to \`require(...)\`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('@acme/untyped-lib');

describe('#gateway/npm/acme__untyped-lib', () => {
  it('VALID: {module} => re-exports the same runtime bindings as @acme/untyped-lib', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
`,
      },
    ]);
  });

  it('VALID: {shape: esm-only} => type-only barrel and a test that never loads the package', () => {
    const dependency = GatewayNpmDependencyStub({ name: 'ink', range: '^5.0.0', folder: 'ink' });

    const result = gatewayNpmPassthroughFilesTransformer({
      dependency,
      shape: NpmModuleExportShapeStub({ value: 'esm-only' }),
    });

    expect(result).toStrictEqual([
      {
        relativePath: 'ink/ink.ts',
        contents: `/**
 * PURPOSE: Pass-through for the npm package 'ink'. Code outside the gateway imports ink
 * through here instead of the raw package, so a future guard or override on ink lands in
 * this one file and reaches every caller.
 *
 * 'ink' is ESM-only, and this CommonJS gateway package cannot \`require\` it, so this
 * re-exports its types only, resolved as an ES import (\`resolution-mode\`). A runtime value needs a
 * wrapper beside this barrel that loads the package with \`import()\`.
 *
 * USAGE:
 * import type { SomeType } from '#gateway/npm/ink';
 */

export type * from 'ink' with { 'resolution-mode': 'import' };
`,
      },
      {
        relativePath: 'ink/ink.test.ts',
        contents: `import * as ourModule from './ink';

// The package is ESM-only, so this test never loads it: the barrel re-exports types alone, which
// compile away, and the module it leaves behind carries no runtime value at all.
describe('#gateway/npm/ink', () => {
  it('VALID: {module} => re-exports types only, so it holds no runtime export', () => {
    expect({ ...ourModule }).toStrictEqual({});
  });
});
`,
      },
    ]);
  });
});
