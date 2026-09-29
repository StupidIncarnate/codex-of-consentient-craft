import * as ts from '#gateway/npm/typescript';

import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContractUsesBindingStub } from '../../contracts/contract-uses-binding/contract-uses-binding.stub';
import { IdentifierStub } from '../../contracts/identifier/identifier.stub';
import { contractUsesScanLayerTransformer } from './contract-uses-scan-layer-transformer';

const targetFile = AbsoluteFilePathStub({ value: '/repo/packages/a/src/thing/thing-contract.ts' });
const thingBinding = ContractUsesBindingStub({
  localName: IdentifierStub({ value: 'thingContract' }),
  targetFile,
  isTypeOnly: false,
});

describe('contractUsesScanLayerTransformer', () => {
  describe('parse calls', () => {
    it.each(['parse', 'safeParse', 'parseAsync', 'safeParseAsync'])(
      'VALID: {thingContract.%s(value)} => records a parse site on line 2',
      (method) => {
        const sourceFile = ts.createSourceFile(
          '/repo/packages/a/src/x.ts',
          `const a = 1;\nconst b = thingContract.${method}(value);`,
          ts.ScriptTarget.Latest,
          true,
        );

        const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

        expect(result).toStrictEqual({
          parseSites: [{ targetFile, site: { filePath: '/repo/packages/a/src/x.ts', line: 2 } }],
          valueTargets: [targetFile],
        });
      },
    );

    it('VALID: {z.array(thingContract).parse(value)} => counts a parse built from the contract', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'z.array(thingContract).parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

      expect(result).toStrictEqual({
        parseSites: [{ targetFile, site: { filePath: '/repo/packages/a/src/x.ts', line: 1 } }],
        valueTargets: [targetFile],
      });
    });

    it('VALID: {thingContract.shape.id.parse(value)} => counts a parse of a field', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'thingContract.shape.id.parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

      expect(result).toStrictEqual({
        parseSites: [{ targetFile, site: { filePath: '/repo/packages/a/src/x.ts', line: 1 } }],
        valueTargets: [targetFile],
      });
    });

    it('VALID: {other.parse(thingContract)} => the contract is an argument, so not parsed', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'other.parse(thingContract);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

      expect(result).toStrictEqual({ parseSites: [], valueTargets: [targetFile] });
    });
  });

  describe('value uses', () => {
    it('VALID: {z.object({ thing: thingContract })} => records a value use without a parse', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'export const wrapContract = z.object({ thing: thingContract });',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

      expect(result).toStrictEqual({ parseSites: [], valueTargets: [targetFile] });
    });

    it('VALID: {a property named like the binding} => is not a use', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'const a = obj.thingContract; const b = { thingContract: 1 };',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

      expect(result).toStrictEqual({ parseSites: [], valueTargets: [] });
    });

    it('VALID: {typeof thingContract in a type position} => is not a use', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'export type Thing = z.infer<typeof thingContract>;',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

      expect(result).toStrictEqual({ parseSites: [], valueTargets: [] });
    });

    it('VALID: {the import declaration itself} => is not a use', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        "import { thingContract } from './thing/thing-contract';\nexport { thingContract } from './thing/thing-contract';",
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [thingBinding] });

      expect(result).toStrictEqual({ parseSites: [], valueTargets: [] });
    });
  });

  describe('bindings', () => {
    it('EMPTY: {no bindings} => returns nothing', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'thingContract.parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, bindings: [] });

      expect(result).toStrictEqual({ parseSites: [], valueTargets: [] });
    });

    it('VALID: {type-only binding} => is ignored', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'thingContract.parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        bindings: [ContractUsesBindingStub({ targetFile, isTypeOnly: true })],
      });

      expect(result).toStrictEqual({ parseSites: [], valueTargets: [] });
    });
  });
});
