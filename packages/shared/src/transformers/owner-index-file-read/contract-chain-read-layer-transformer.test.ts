import * as ts from '#gateway/npm/typescript';

import { contractChainReadLayerTransformer } from './contract-chain-read-layer-transformer';

const initializerOf = ({ text }: { text: string }): ts.Node => {
  const sourceFile = ts.createSourceFile(
    '/repo/x-contract.ts',
    `const value = ${text};`,
    ts.ScriptTarget.Latest,
    true,
  );
  const [statement] = sourceFile.statements;
  if (statement === undefined || !ts.isVariableStatement(statement)) {
    throw new Error(`no variable statement in ${text}`);
  }
  const [declaration] = statement.declarationList.declarations;
  if (declaration?.initializer === undefined) {
    throw new Error(`no initializer in ${text}`);
  }
  return declaration.initializer;
};

describe('contractChainReadLayerTransformer', () => {
  describe('brands', () => {
    it("VALID: {z.string().min(1).brand<'QuestId'>()} => brand text QuestId and root z", () => {
      const result = contractChainReadLayerTransformer({
        node: initializerOf({ text: "z.string().min(1).brand<'QuestId'>()" }),
      });

      expect({ ...result, objectLiteral: undefined }).toStrictEqual({
        brandText: 'QuestId',
        shapeContractName: undefined,
        shapeKey: undefined,
        rootName: 'z',
        objectLiteral: undefined,
      });
    });

    it("VALID: {z.string().brand<'A'>().brand<'B'>()} => the outermost brand wins", () => {
      const result = contractChainReadLayerTransformer({
        node: initializerOf({ text: "z.string().brand<'A'>().brand<'B'>()" }),
      });

      expect(result.brandText).toBe('B');
    });
  });

  describe('shape reuse', () => {
    it('VALID: {questContract.shape.id.optional()} => reuses questContract key id', () => {
      const result = contractChainReadLayerTransformer({
        node: initializerOf({ text: 'questContract.shape.id.optional()' }),
      });

      expect({
        brandText: result.brandText,
        shapeContractName: result.shapeContractName,
        shapeKey: result.shapeKey,
      }).toStrictEqual({
        brandText: undefined,
        shapeContractName: 'questContract',
        shapeKey: 'id',
      });
    });
  });

  describe('roots', () => {
    it('VALID: {questIdContract.optional()} => root name questIdContract and no shape', () => {
      const result = contractChainReadLayerTransformer({
        node: initializerOf({ text: 'questIdContract.optional()' }),
      });

      expect({ rootName: result.rootName, shapeKey: result.shapeKey }).toStrictEqual({
        rootName: 'questIdContract',
        shapeKey: undefined,
      });
    });

    it("VALID: {z.object({ id: x }).extend({}).brand<'Quest'>()} => the root object literal and the brand", () => {
      const result = contractChainReadLayerTransformer({
        node: initializerOf({ text: "z.object({ id: x }).extend({}).brand<'Quest'>()" }),
      });

      expect({
        brandText: result.brandText,
        literal: result.objectLiteral?.getText(),
      }).toStrictEqual({
        brandText: 'Quest',
        literal: '{ id: x }',
      });
    });

    it('EMPTY: {a literal} => reports nothing', () => {
      const result = contractChainReadLayerTransformer({ node: initializerOf({ text: '42' }) });

      expect(result).toStrictEqual({
        brandText: undefined,
        shapeContractName: undefined,
        shapeKey: undefined,
        rootName: undefined,
        objectLiteral: undefined,
      });
    });
  });
});
