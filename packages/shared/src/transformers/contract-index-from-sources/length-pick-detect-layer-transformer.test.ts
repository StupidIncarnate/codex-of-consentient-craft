import * as ts from '#gateway/npm/typescript';

import { lengthPickDetectLayerTransformer } from './length-pick-detect-layer-transformer';

const detect = ({ typeText }: { typeText: string }): boolean[] =>
  ts
    .createSourceFile(
      '/repo/a-contract.ts',
      `type Thing = ${typeText};`,
      ts.ScriptTarget.Latest,
      true,
    )
    .statements.filter(ts.isTypeAliasDeclaration)
    .map((alias) => lengthPickDetectLayerTransformer({ node: alias.type }));

describe('lengthPickDetectLayerTransformer', () => {
  describe('valid input', () => {
    it.each([
      ['Pick<unknown[][], "length">', true],
      ["Pick<unknown[][], 'length'>", true],
      ['Pick<unknown[][], "size">', false],
      ['Pick<Thing, "length">', false],
      ['Pick<unknown[][]>', false],
      ['Omit<unknown[][], "length">', false],
      ['ns.Pick<unknown[][], "length">', false],
    ])('VALID: {%s} => returns %s', (typeText, expected) => {
      const result = detect({ typeText });

      expect(result).toStrictEqual([expected]);
    });
  });
});
