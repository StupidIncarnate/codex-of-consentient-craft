import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { SwitchCaseStub } from './switch-case.stub';

describe('SwitchCaseStub', () => {
  it('VALID: {} => a real SwitchCase parsed from the default code', () => {
    const node = SwitchCaseStub();

    expect({ type: node.type, text: 'switch (a) { case 1: }'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.SwitchCase,
      text: 'case 1:',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = SwitchCaseStub({ code: '  switch (a) { case 1: }' });

    expect(node.range).toStrictEqual([
      SwitchCaseStub().range[0] + 2,
      SwitchCaseStub().range[1] + 2,
    ]);
  });
});
