import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSVoidKeywordStub } from './ts-void-keyword.stub';

describe('TSVoidKeywordStub', () => {
  it('VALID: {} => a real TSVoidKeyword parsed from the default code', () => {
    const node = TSVoidKeywordStub();

    expect({ type: node.type, text: 'let x: void;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSVoidKeyword,
      text: 'void',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSVoidKeywordStub({ code: '  let x: void;' });

    expect(node.range).toStrictEqual([
      TSVoidKeywordStub().range[0] + 2,
      TSVoidKeywordStub().range[1] + 2,
    ]);
  });
});
