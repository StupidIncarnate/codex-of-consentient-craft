import { resolvePackageRoot } from '#gateway/node/module';
import { copyCompileLayerBroker } from './copy-compile-layer-broker';
import { copyCompileLayerBrokerProxy } from './copy-compile-layer-broker.proxy';

const REPO_ROOT = '/repo';
const SRC_ROOT = '/repo/packages/@gateway/npm/src';
const OWN_SRC_ROOT = `${String(resolvePackageRoot({ specifier: '@dungeonmaster/npm/package.json' }))}/src`;

describe('copyCompileLayerBroker', () => {
  it('VALID: {a file that type-checks} => returns no diagnostics', () => {
    copyCompileLayerBrokerProxy();

    const result = copyCompileLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      files: new Map([[`${SRC_ROOT}/left/left.ts`, 'export const left: number = 1;\n']]),
      checkedPaths: [`${SRC_ROOT}/left/left.ts`],
    });

    expect(result).toStrictEqual([]);
  });

  it('INVALID: {a type error} => returns it with its file, line and code', () => {
    copyCompileLayerBrokerProxy();

    const result = copyCompileLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      files: new Map([[`${SRC_ROOT}/left/left.ts`, "\nexport const left: number = 'one';\n"]]),
      checkedPaths: [`${SRC_ROOT}/left/left.ts`],
    });

    expect(result).toStrictEqual([
      "packages/@gateway/npm/src/left/left.ts(2): TS2322: Type 'string' is not assignable to type 'number'.",
    ]);
  });

  it('INVALID: {an import of a package nobody installed} => returns the unresolved module', () => {
    copyCompileLayerBrokerProxy();

    const result = copyCompileLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      files: new Map([[`${SRC_ROOT}/left/left.ts`, "export * from 'left-pad-missing';\n"]]),
      checkedPaths: [`${SRC_ROOT}/left/left.ts`],
    });

    expect(result).toStrictEqual([
      "packages/@gateway/npm/src/left/left.ts(1): TS2307: Cannot find module 'left-pad-missing' or its corresponding type declarations.",
    ]);
  });

  it('VALID: {relative and #gateway/npm imports between planned files} => resolves both and returns no diagnostics', () => {
    copyCompileLayerBrokerProxy();

    const result = copyCompileLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      files: new Map([
        [
          `${SRC_ROOT}/left/left.ts`,
          "import { width } from './width/width';\nimport { right } from '#gateway/npm/right';\nexport const left: number = width + right;\n",
        ],
        [`${SRC_ROOT}/left/width/width.ts`, 'export const width = 2;\n'],
        [`${SRC_ROOT}/right/right.ts`, 'export const right = 3;\n'],
      ]),
      checkedPaths: [`${SRC_ROOT}/left/left.ts`, `${SRC_ROOT}/left/width/width.ts`],
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {#gateway/npm/zod, a folder nobody has written yet} => resolves it to our own copy', () => {
    copyCompileLayerBrokerProxy();

    const result = copyCompileLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      files: new Map([
        [
          `${SRC_ROOT}/left/left.ts`,
          "import { z } from '#gateway/npm/zod';\nexport const leftSchema = z.string();\n",
        ],
      ]),
      checkedPaths: [`${SRC_ROOT}/left/left.ts`],
    });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {a planned file outside checkedPaths has an error} => does not count it', () => {
    copyCompileLayerBrokerProxy();

    const result = copyCompileLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      files: new Map([
        [`${SRC_ROOT}/left/left.ts`, 'export const left: number = 1;\n'],
        [`${SRC_ROOT}/right/right.ts`, "export const right: number = 'three';\n"],
      ]),
      checkedPaths: [`${SRC_ROOT}/left/left.ts`],
    });

    expect(result).toStrictEqual([]);
  });
});
