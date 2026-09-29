import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSUnknownKeywordStub } from './ts-unknown-keyword.stub';

describe('TSUnknownKeywordStub', () => {
  it('VALID: {} => a real TSUnknownKeyword parsed from the default code', () => {
    const node = TSUnknownKeywordStub();

    expect({ type: node.type, text: 'let x: unknown;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSUnknownKeyword,
      text: 'unknown',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSUnknownKeywordStub({ code: '  let x: unknown;' });

    expect(node.range).toStrictEqual([
      TSUnknownKeywordStub().range[0] + 2,
      TSUnknownKeywordStub().range[1] + 2,
    ]);
  });
});
