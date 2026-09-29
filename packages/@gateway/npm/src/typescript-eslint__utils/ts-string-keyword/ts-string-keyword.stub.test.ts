import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSStringKeywordStub } from './ts-string-keyword.stub';

describe('TSStringKeywordStub', () => {
  it('VALID: {} => a real TSStringKeyword parsed from the default code', () => {
    const node = TSStringKeywordStub();

    expect({ type: node.type, text: 'let x: string;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSStringKeyword,
      text: 'string',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSStringKeywordStub({ code: '  let x: string;' });

    expect(node.range).toStrictEqual([
      TSStringKeywordStub().range[0] + 2,
      TSStringKeywordStub().range[1] + 2,
    ]);
  });
});
