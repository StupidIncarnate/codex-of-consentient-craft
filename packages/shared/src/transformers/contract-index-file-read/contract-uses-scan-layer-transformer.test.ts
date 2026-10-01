import * as ts from '#gateway/npm/typescript';

import { contractUsesScanLayerTransformer } from './contract-uses-scan-layer-transformer';

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

        const result = contractUsesScanLayerTransformer({
          sourceFile,
          candidateNames: ['thingContract'],
        });

        expect(result).toStrictEqual({
          parseCalls: [{ line: 2, parsedNames: ['thingContract'], wholeNames: ['thingContract'] }],
          valueNames: ['thingContract'],
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

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({
        parseCalls: [{ line: 1, parsedNames: ['thingContract'], wholeNames: ['thingContract'] }],
        valueNames: ['thingContract'],
      });
    });

    it('VALID: {thingContract.shape.id.parse(value)} => a parse site, but not a whole one', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'thingContract.shape.id.parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({
        parseCalls: [{ line: 1, parsedNames: ['thingContract'], wholeNames: [] }],
        valueNames: ['thingContract'],
      });
    });

    it('VALID: {other.parse(thingContract)} => the contract is an argument, so not parsed', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'other.parse(thingContract);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({ parseCalls: [], valueNames: ['thingContract'] });
    });
  });

  describe('whole versus field parses', () => {
    it('VALID: {z.array(thingContract.shape.id).parse(value)} => a field reach inside an array is not whole', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'z.array(thingContract.shape.id).parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({
        parseCalls: [{ line: 1, parsedNames: ['thingContract'], wholeNames: [] }],
        valueNames: ['thingContract'],
      });
    });

    it('VALID: {one parse naming the contract whole and through a field} => is whole', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'z.union([thingContract, thingContract.shape.id]).parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({
        parseCalls: [{ line: 1, parsedNames: ['thingContract'], wholeNames: ['thingContract'] }],
        valueNames: ['thingContract'],
      });
    });

    it('VALID: {thingContract.extend({}).parse(value)} => a derived schema counts as whole', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'thingContract.extend({}).parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({
        parseCalls: [{ line: 1, parsedNames: ['thingContract'], wholeNames: ['thingContract'] }],
        valueNames: ['thingContract'],
      });
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

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({ parseCalls: [], valueNames: ['thingContract'] });
    });

    it('VALID: {a property named like the binding} => is not a use', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'const a = obj.thingContract; const b = { thingContract: 1 };',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({ parseCalls: [], valueNames: [] });
    });

    it('VALID: {typeof thingContract in a type position} => is not a use', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'export type Thing = z.infer<typeof thingContract>;',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({ parseCalls: [], valueNames: [] });
    });

    it('VALID: {the import declaration itself} => is not a use', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        "import { thingContract } from './thing/thing-contract';\nexport { thingContract } from './thing/thing-contract';",
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['thingContract'],
      });

      expect(result).toStrictEqual({ parseCalls: [], valueNames: [] });
    });
  });

  describe('candidates', () => {
    it('EMPTY: {no candidate names} => returns nothing', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'thingContract.parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({ sourceFile, candidateNames: [] });

      expect(result).toStrictEqual({ parseCalls: [], valueNames: [] });
    });

    it('VALID: {two candidates in one parse, one through a field} => records both, only one whole', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/packages/a/src/x.ts',
        'z.union([bContract.shape.id, aContract]).parse(value);',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractUsesScanLayerTransformer({
        sourceFile,
        candidateNames: ['aContract', 'bContract'],
      });

      expect(result).toStrictEqual({
        parseCalls: [
          { line: 1, parsedNames: ['aContract', 'bContract'], wholeNames: ['aContract'] },
        ],
        valueNames: ['aContract', 'bContract'],
      });
    });
  });
});
