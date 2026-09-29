import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSTypeReferenceStub } from './ts-type-reference.stub';

describe('TSTypeReferenceStub', () => {
  it('VALID: {} => a real TSTypeReference parsed from the default code', () => {
    const node = TSTypeReferenceStub();

    expect({ type: node.type, text: 'let x: T;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSTypeReference,
      text: 'T',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSTypeReferenceStub({ code: '  let x: T;' });

    expect(node.range).toStrictEqual([
      TSTypeReferenceStub().range[0] + 2,
      TSTypeReferenceStub().range[1] + 2,
    ]);
  });
});
