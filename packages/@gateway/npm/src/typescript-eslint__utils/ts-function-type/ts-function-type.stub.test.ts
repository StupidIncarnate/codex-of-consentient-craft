import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSFunctionTypeStub } from './ts-function-type.stub';

describe('TSFunctionTypeStub', () => {
  it('VALID: {} => a real TSFunctionType parsed from the default code', () => {
    const node = TSFunctionTypeStub();

    expect({ type: node.type, text: 'let x: () => void;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSFunctionType,
      text: '() => void',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSFunctionTypeStub({ code: '  let x: () => void;' });

    expect(node.range).toStrictEqual([
      TSFunctionTypeStub().range[0] + 2,
      TSFunctionTypeStub().range[1] + 2,
    ]);
  });
});
