import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSIndexSignatureStub } from './ts-index-signature.stub';

describe('TSIndexSignatureStub', () => {
  it('VALID: {} => a real TSIndexSignature parsed from the default code', () => {
    const node = TSIndexSignatureStub();

    expect({
      type: node.type,
      text: 'type T = { [k: string]: number };'.slice(...node.range),
    }).toStrictEqual({
      type: AST_NODE_TYPES.TSIndexSignature,
      text: '[k: string]: number',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSIndexSignatureStub({ code: '  type T = { [k: string]: number };' });

    expect(node.range).toStrictEqual([
      TSIndexSignatureStub().range[0] + 2,
      TSIndexSignatureStub().range[1] + 2,
    ]);
  });
});
