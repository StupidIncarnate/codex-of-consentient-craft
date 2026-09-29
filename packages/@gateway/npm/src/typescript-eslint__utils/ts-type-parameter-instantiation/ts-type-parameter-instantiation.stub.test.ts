import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSTypeParameterInstantiationStub } from './ts-type-parameter-instantiation.stub';

describe('TSTypeParameterInstantiationStub', () => {
  it('VALID: {} => a real TSTypeParameterInstantiation parsed from the default code', () => {
    const node = TSTypeParameterInstantiationStub();

    expect({ type: node.type, text: 'let x: A<B>;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSTypeParameterInstantiation,
      text: '<B>',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSTypeParameterInstantiationStub({ code: '  let x: A<B>;' });

    expect(node.range).toStrictEqual([
      TSTypeParameterInstantiationStub().range[0] + 2,
      TSTypeParameterInstantiationStub().range[1] + 2,
    ]);
  });
});
