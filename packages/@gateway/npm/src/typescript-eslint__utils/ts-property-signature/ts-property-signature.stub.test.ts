import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSPropertySignatureStub } from './ts-property-signature.stub';

describe('TSPropertySignatureStub', () => {
  it('VALID: {} => a real TSPropertySignature parsed from the default code', () => {
    const node = TSPropertySignatureStub();

    expect({ type: node.type, text: 'type T = { a: string };'.slice(...node.range) }).toStrictEqual(
      {
        type: AST_NODE_TYPES.TSPropertySignature,
        text: 'a: string',
      },
    );
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSPropertySignatureStub({ code: '  type T = { a: string };' });

    expect(node.range).toStrictEqual([
      TSPropertySignatureStub().range[0] + 2,
      TSPropertySignatureStub().range[1] + 2,
    ]);
  });
});
