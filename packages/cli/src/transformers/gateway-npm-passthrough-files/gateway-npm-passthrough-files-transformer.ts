/**
 * PURPOSE: The two files the npm-gateway sync writes for a dependency dungeonmaster has no wrapper
 * of its own for — `<folder>/<folder>.ts`, a pure re-export barrel, and `<folder>/<folder>.test.ts`,
 * proving the barrel hands back the package's real runtime shape. The barrel's syntax follows the
 * package's own declarations (`NpmModuleExportShape`): TypeScript refuses `export *` against an
 * `export =` module, so that shape re-exports the whole module instead, and its test asserts the two
 * are the same object rather than comparing keys. An ESM-only package, which this CommonJS gateway
 * cannot `require`, gets a type-only barrel — `export type *` still needs the `resolution-mode:
 * 'import'` attribute, or a CommonJS file referencing an ES module is TS1479 — whose test never
 * loads the package. Pure, so the plan can be reported under `npm ci`
 * without writing anything.
 *
 * USAGE:
 * gatewayNpmPassthroughFilesTransformer({ dependency, shape: 'named' });
 * // Returns [ScaffoldFile for left-pad/left-pad.ts, ScaffoldFile for left-pad/left-pad.test.ts]
 */

import type { GatewayNpmDependency } from '../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import type { NpmModuleExportShape } from '../../contracts/npm-module-export-shape/npm-module-export-shape-contract';
import {
  scaffoldFileContract,
  type ScaffoldFile,
} from '../../contracts/scaffold-file/scaffold-file-contract';

const RAW_REQUIRE_COMMENT = [
  "// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any",
  '// CJS module that lacks __esModule, which is every third-party package here — comparing',
  '// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles',
  "// straight to `require(...)`, so pkgModule is the package's own real runtime shape.",
].join('\n');

export const gatewayNpmPassthroughFilesTransformer = ({
  dependency,
  shape,
}: {
  dependency: GatewayNpmDependency;
  shape: NpmModuleExportShape;
}): readonly ScaffoldFile[] => {
  const { name: packageName, folder } = dependency;
  const shapeNote =
    shape === 'untyped'
      ? `\n *\n * '${packageName}' resolved no type declarations when this file was generated, so every import\n * through here is untyped until the package or an @types package supplies them.`
      : shape === 'esm-only'
        ? `\n *\n * '${packageName}' is ESM-only, and this CommonJS gateway package cannot \`require\` it, so this\n * re-exports its types only, resolved as an ES import (\`resolution-mode\`). A runtime value needs a\n * wrapper beside this barrel that loads the package with \`import()\`.`
        : '';
  const usageLine =
    shape === 'export-equals'
      ? `import pkg from '#gateway/npm/${folder}';`
      : shape === 'esm-only'
        ? `import type { SomeType } from '#gateway/npm/${folder}';`
        : `import { someExport } from '#gateway/npm/${folder}';`;

  const header = `/**
 * PURPOSE: Pass-through for the npm package '${packageName}'. Code outside the gateway imports ${packageName}
 * through here instead of the raw package, so a future guard or override on ${packageName} lands in
 * this one file and reaches every caller.${shapeNote}
 *
 * USAGE:
 * ${usageLine}
 */
`;

  const barrelBody =
    shape === 'export-equals'
      ? `import pkgModule = require('${packageName}');\n\nexport = pkgModule;\n`
      : shape === 'named-and-default'
        ? `export * from '${packageName}';\nexport { default } from '${packageName}';\n`
        : shape === 'esm-only'
          ? `export type * from '${packageName}' with { 'resolution-mode': 'import' };\n`
          : `export * from '${packageName}';\n`;

  const testBody =
    shape === 'export-equals'
      ? `import ourModule = require('./${folder}');
${RAW_REQUIRE_COMMENT}
import pkgModule = require('${packageName}');

describe('#gateway/npm/${folder}', () => {
  it('VALID: {module} => is the same module object as ${packageName}', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
`
      : shape === 'esm-only'
        ? `import * as ourModule from './${folder}';

// The package is ESM-only, so this test never loads it: the barrel re-exports types alone, which
// compile away, and the module it leaves behind carries no runtime value at all.
describe('#gateway/npm/${folder}', () => {
  it('VALID: {module} => re-exports types only, so it holds no runtime export', () => {
    expect({ ...ourModule }).toStrictEqual({});
  });
});
`
        : `import * as ourModule from './${folder}';
${RAW_REQUIRE_COMMENT}
import pkgModule = require('${packageName}');

describe('#gateway/npm/${folder}', () => {
  it('VALID: {module} => re-exports the same runtime bindings as ${packageName}', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
`;

  return [
    scaffoldFileContract.parse({
      relativePath: `${folder}/${folder}.ts`,
      contents: `${header}\n${barrelBody}`,
    }),
    scaffoldFileContract.parse({
      relativePath: `${folder}/${folder}.test.ts`,
      contents: testBody,
    }),
  ];
};
