import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSInterfaceBodyStub } from './ts-interface-body.stub';

describe('TSInterfaceBodyStub', () => {
  it('VALID: {} => a real TSInterfaceBody parsed from the default code', () => {
    const node = TSInterfaceBodyStub();

    expect({
      type: node.type,
      text: 'interface I { a: string }'.slice(...node.range),
    }).toStrictEqual({
      type: AST_NODE_TYPES.TSInterfaceBody,
      text: '{ a: string }',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSInterfaceBodyStub({ code: '  interface I { a: string }' });

    expect(node.range).toStrictEqual([
      TSInterfaceBodyStub().range[0] + 2,
      TSInterfaceBodyStub().range[1] + 2,
    ]);
  });
});
