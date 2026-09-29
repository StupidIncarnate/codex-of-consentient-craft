import * as ts from '#gateway/npm/typescript';

import { IdentifierStub } from '../../contracts/identifier/identifier.stub';
import { phantomInterfaceDetectLayerTransformer } from './phantom-interface-detect-layer-transformer';

describe('phantomInterfaceDetectLayerTransformer', () => {
  describe('valid input', () => {
    it.each([
      ['interface Carrier { readonly [ING]: unknown }', true],
      ['interface Carrier { readonly [ING]: unknown; readonly [ OTHER ]: number }', true],
      ['interface Carrier { readonly [ING]: unknown; id: string }', false],
      ['interface Carrier { readonly [ING]: unknown; send(): void }', false],
      ['interface Carrier { readonly [NOT_A_SYMBOL]: unknown }', false],
      ['interface Carrier extends Base { readonly [ING]: unknown }', false],
      ['interface Carrier {}', false],
    ])('VALID: {%s} => returns %s', (text, expected) => {
      const sourceFile = ts.createSourceFile(
        '/repo/a-contract.ts',
        text,
        ts.ScriptTarget.Latest,
        true,
      );

      const result = sourceFile.statements.filter(ts.isInterfaceDeclaration).map((declaration) =>
        phantomInterfaceDetectLayerTransformer({
          declaration,
          uniqueSymbolNames: [IdentifierStub({ value: 'ING' }), IdentifierStub({ value: 'OTHER' })],
        }),
      );

      expect(result).toStrictEqual([expected]);
    });
  });
});
