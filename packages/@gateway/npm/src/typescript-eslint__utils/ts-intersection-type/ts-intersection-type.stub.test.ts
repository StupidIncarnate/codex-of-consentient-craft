import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSIntersectionTypeStub } from './ts-intersection-type.stub';

describe('TSIntersectionTypeStub', () => {
  it('VALID: {} => a real TSIntersectionType parsed from the default code', () => {
    const node = TSIntersectionTypeStub();

    expect({ type: node.type, text: 'let x: A & B;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSIntersectionType,
      text: 'A & B',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSIntersectionTypeStub({ code: '  let x: A & B;' });

    expect(node.range).toStrictEqual([
      TSIntersectionTypeStub().range[0] + 2,
      TSIntersectionTypeStub().range[1] + 2,
    ]);
  });
});
