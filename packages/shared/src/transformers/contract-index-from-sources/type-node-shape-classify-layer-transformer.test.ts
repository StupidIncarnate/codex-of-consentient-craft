import * as ts from '#gateway/npm/typescript';

import { IdentifierStub } from '../../contracts/identifier/identifier.stub';
import { typeNodeShapeClassifyLayerTransformer } from './type-node-shape-classify-layer-transformer';

const classifyThing = ({ text }: { text: string }): string[] => {
  const sourceFile = ts.createSourceFile('/repo/a-contract.ts', text, ts.ScriptTarget.Latest, true);
  const typeAliases = sourceFile.statements.flatMap(
    (statement): { name: ReturnType<typeof IdentifierStub>; node: ts.Node }[] => {
      if (ts.isTypeAliasDeclaration(statement)) {
        return [{ name: IdentifierStub({ value: statement.name.text }), node: statement.type }];
      }
      return ts.isInterfaceDeclaration(statement)
        ? [{ name: IdentifierStub({ value: statement.name.text }), node: statement }]
        : [];
    },
  );
  return typeAliases
    .filter((alias) => String(alias.name) === 'Thing')
    .map((alias) =>
      typeNodeShapeClassifyLayerTransformer({
        node: alias.node,
        schemaNames: [],
        typeAliases,
        uniqueSymbolNames: [IdentifierStub({ value: 'ING' })],
        visitedNames: [IdentifierStub({ value: 'Thing' })],
      }),
    );
};

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

    it.each([
      [
        'type ThingData = z.infer<typeof thingContract>; type Thing = ThingData & { send: () => void }',
        'data-plus-functions',
      ],
      ['type ThingData = z.infer<typeof thingContract>; type Thing = ThingData', 'inferred'],
      ['type Send = () => void; type Thing = { handler: Send }', 'functions'],
      [
        'type Send = () => void; type Thing = z.infer<typeof thingContract> & { handler: Send }',
        'data-plus-functions',
      ],
      ['type Plain = { id: string }; type Thing = Plain', 'other'],
      ['type Plain = { id: string }; type Thing = z.infer<typeof thingContract> & Plain', 'other'],
      ['type Id = string; type Thing = { handler: Id }', 'other'],
      ['type Id = string; type Thing = { send: () => void; id: Id }', 'other'],
      ['type Thing = Missing', 'other'],
      ['type A = B; type B = A; type Thing = A', 'other'],
      [
        'type A = B & { go: () => void }; type B = A & { stop: () => void }; type Thing = A',
        'other',
      ],
    ])('VALID: {same-file aliases: %s} => returns %s', (text, expected) => {
      const sourceFile = ts.createSourceFile(
        '/repo/a-contract.ts',
        text,
        ts.ScriptTarget.Latest,
        true,
      );
      const declarations = sourceFile.statements.filter(ts.isTypeAliasDeclaration);
      const typeAliases = declarations.map((declaration) => ({
        name: IdentifierStub({ value: declaration.name.text }),
        node: declaration.type,
      }));

      const shapes = declarations
        .filter((declaration) => declaration.name.text === 'Thing')
        .map((declaration) =>
          typeNodeShapeClassifyLayerTransformer({
            node: declaration.type,
            schemaNames: [IdentifierStub({ value: 'thingContract' })],
            typeAliases,
            visitedNames: [IdentifierStub({ value: 'Thing' })],
          }),
        );

      expect(shapes).toStrictEqual([expected]);
    });

    it.each([
      [
        'interface Carrier { readonly [ING]: unknown } type Thing = Record<string, Carrier>',
        'phantom',
      ],
      ['interface Carrier { readonly [ING]: unknown } type Thing = Readonly<Carrier>', 'phantom'],
      [
        'interface Carrier { readonly [ING]: unknown } type Thing = Readonly<Record<string, Carrier>>',
        'phantom',
      ],
      [
        'interface Carrier { readonly [ING]: unknown; id: string } type Thing = Record<string, Carrier>',
        'other',
      ],
      ['interface Data { id: string } type Thing = Record<string, Data>', 'other'],
      ['type Thing = Record<string, string>', 'other'],
      ['type Thing = Record<string, Missing>', 'other'],
    ])('VALID: {phantom carrier: %s} => returns %s', (text, expected) => {
      expect(classifyThing({ text })).toStrictEqual([expected]);
    });

    it('VALID: {phantom interface itself} => returns phantom', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/a-contract.ts',
        'interface Carrier { readonly [ING]: unknown }',
        ts.ScriptTarget.Latest,
        true,
      );

      const shapes = sourceFile.statements.filter(ts.isInterfaceDeclaration).map((declaration) =>
        typeNodeShapeClassifyLayerTransformer({
          node: declaration,
          schemaNames: [],
          uniqueSymbolNames: [IdentifierStub({ value: 'ING' })],
        }),
      );

      expect(shapes).toStrictEqual(['phantom']);
    });
  });
});
