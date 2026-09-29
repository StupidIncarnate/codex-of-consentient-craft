import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSTypePredicateStub } from './ts-type-predicate.stub';

describe('TSTypePredicateStub', () => {
  it('VALID: {} => a real TSTypePredicate parsed from the default code', () => {
    const node = TSTypePredicateStub();

    expect({
      type: node.type,
      text: 'function f(x): x is string {}'.slice(...node.range),
    }).toStrictEqual({
      type: AST_NODE_TYPES.TSTypePredicate,
      text: 'x is string',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSTypePredicateStub({ code: '  function f(x): x is string {}' });

    expect(node.range).toStrictEqual([
      TSTypePredicateStub().range[0] + 2,
      TSTypePredicateStub().range[1] + 2,
    ]);
  });
});
