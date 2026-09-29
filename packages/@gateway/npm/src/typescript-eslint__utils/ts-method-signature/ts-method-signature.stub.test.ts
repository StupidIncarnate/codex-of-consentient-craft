import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSMethodSignatureStub } from './ts-method-signature.stub';

describe('TSMethodSignatureStub', () => {
  it('VALID: {} => a real TSMethodSignature parsed from the default code', () => {
    const node = TSMethodSignatureStub();

    expect({ type: node.type, text: 'type T = { m(): void };'.slice(...node.range) }).toStrictEqual(
      {
        type: AST_NODE_TYPES.TSMethodSignature,
        text: 'm(): void',
      },
    );
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSMethodSignatureStub({ code: '  type T = { m(): void };' });

    expect(node.range).toStrictEqual([
      TSMethodSignatureStub().range[0] + 2,
      TSMethodSignatureStub().range[1] + 2,
    ]);
  });
});
