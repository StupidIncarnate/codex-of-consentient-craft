import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSBooleanKeywordStub } from './ts-boolean-keyword.stub';

describe('TSBooleanKeywordStub', () => {
  it('VALID: {} => a real TSBooleanKeyword parsed from the default code', () => {
    const node = TSBooleanKeywordStub();

    expect({ type: node.type, text: 'let x: boolean;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSBooleanKeyword,
      text: 'boolean',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSBooleanKeywordStub({ code: '  let x: boolean;' });

    expect(node.range).toStrictEqual([
      TSBooleanKeywordStub().range[0] + 2,
      TSBooleanKeywordStub().range[1] + 2,
    ]);
  });
});
