import * as ts from '#gateway/npm/typescript';

import { IdentifierStub } from '../../contracts/identifier/identifier.stub';
import { typeNodeShapeClassifyLayerTransformer } from './type-node-shape-classify-layer-transformer';

describe('typeNodeShapeClassifyLayerTransformer', () => {
  describe('classified shapes', () => {
    it.each([
      ['z.infer<typeof thingContract>', 'inferred'],
      ['z.input<typeof thingContract>', 'inferred'],
      ['z.output<typeof thingContract>', 'inferred'],
      ['(z.infer<typeof thingContract>)', 'inferred'],
      ['Omit<z.infer<typeof thingContract>, "id">', 'inferred'],
      ['z.infer<typeof thingContract> & z.infer<typeof thingContract>', 'inferred'],
      ['() => void', 'functions'],
      ['{ send: () => void; stop(): void }', 'functions'],
      ['(() => void) & { stop(): void }', 'functions'],
      ['z.infer<typeof thingContract> & { send: () => void }', 'data-plus-functions'],
      ['{ find: { (a: []): string; (a: string[]): number } }', 'functions'],
      ['{ length: number; map: () => void }', 'functions'],
      ['Readonly<Pick<unknown[][], "length">> & { map: () => void }', 'functions'],
      ['{ length: number }', 'other'],
      ['{ length: string; map: () => void }', 'other'],
      ['{ find: { a: string } }', 'other'],
      ['{ find: {} }', 'other'],
      ['Pick<unknown[][], "size">', 'other'],
      ['Pick<Thing, "length">', 'other'],
      ['Readonly<string>', 'other'],
      ['z.infer<typeof otherSchema>', 'other'],
      ['z.infer<Thing>', 'other'],
      ['z.infer', 'other'],
      ['Omit<string, "id">', 'other'],
      ['Omit', 'other'],
      ['string', 'other'],
      ['{ id: string }', 'other'],
      ['{}', 'other'],
      ['{ id: string; send: () => void }', 'other'],
      ['Map<string, number>', 'other'],
      ['z.infer<typeof thingContract> & { id: string }', 'other'],
    ])('VALID: {type: %s} => returns %s', (typeText, expected) => {
      const sourceFile = ts.createSourceFile(
        '/repo/a-contract.ts',
        `export type Thing = ${typeText};`,
        ts.ScriptTarget.Latest,
        true,
      );
      const shapes = sourceFile.statements.filter(ts.isTypeAliasDeclaration).map((alias) =>
        typeNodeShapeClassifyLayerTransformer({
          node: alias.type,
          schemaNames: [IdentifierStub({ value: 'thingContract' })],
        }),
      );

      expect(shapes).toStrictEqual([expected]);
    });

    it('VALID: {interface of methods} => returns functions', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/a-contract.ts',
        'export interface Sender { send(): void }',
        ts.ScriptTarget.Latest,
        true,
      );
      const shapes = sourceFile.statements
        .filter(ts.isInterfaceDeclaration)
        .map((declaration) =>
          typeNodeShapeClassifyLayerTransformer({ node: declaration, schemaNames: [] }),
        );

      expect(shapes).toStrictEqual(['functions']);
    });

    it('VALID: {interface extending another} => returns other', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/a-contract.ts',
        'export interface Sender extends Base { send(): void }',
        ts.ScriptTarget.Latest,
        true,
      );
      const shapes = sourceFile.statements
        .filter(ts.isInterfaceDeclaration)
        .map((declaration) =>
          typeNodeShapeClassifyLayerTransformer({ node: declaration, schemaNames: [] }),
        );

      expect(shapes).toStrictEqual(['other']);
    });
  });
});
