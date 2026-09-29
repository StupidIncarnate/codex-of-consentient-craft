import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSIndexedAccessTypeStub } from './ts-indexed-access-type.stub';

describe('TSIndexedAccessTypeStub', () => {
  it('VALID: {} => a real TSIndexedAccessType parsed from the default code', () => {
    const node = TSIndexedAccessTypeStub();

    expect({ type: node.type, text: 'let x: T["a"];'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSIndexedAccessType,
      text: 'T["a"]',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSIndexedAccessTypeStub({ code: '  let x: T["a"];' });

    expect(node.range).toStrictEqual([
      TSIndexedAccessTypeStub().range[0] + 2,
      TSIndexedAccessTypeStub().range[1] + 2,
    ]);
  });
});
