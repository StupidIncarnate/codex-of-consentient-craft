import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstFunctionUsesContractParseGuard } from './is-ast-function-uses-contract-parse-guard';

describe('isAstFunctionUsesContractParseGuard', () => {
  // Arrow function with expression body: () => contract.parse({})
  it('VALID: {arrow function with direct contract.parse() call} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({
          type: 'MemberExpression',
          object: TsestreeStub({
            type: 'Identifier',
            name: 'userContract',
          }),
          property: TsestreeStub({
            type: 'Identifier',
            name: 'parse',
          }),
        }),
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Arrow function with object expression body: () => ({ ...contract.parse({}) })
  it('VALID: {arrow function with object spread contract.parse()} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'ObjectExpression',
        properties: [
          TsestreeStub({
            type: 'SpreadElement',
            argument: TsestreeStub({
              type: 'CallExpression',
              callee: TsestreeStub({
                type: 'MemberExpression',
                object: TsestreeStub({
                  type: 'Identifier',
                  name: 'dataContract',
                }),
                property: TsestreeStub({
                  type: 'Identifier',
                  name: 'parse',
                }),
              }),
            }),
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Block statement with return contract.parse()
  it('VALID: {function with return contract.parse()} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'ReturnStatement',
            argument: TsestreeStub({
              type: 'CallExpression',
              callee: TsestreeStub({
                type: 'MemberExpression',
                object: TsestreeStub({
                  type: 'Identifier',
                  name: 'userContract',
                }),
                property: TsestreeStub({
                  type: 'Identifier',
                  name: 'parse',
                }),
              }),
            }),
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Block statement with return { ...contract.parse() }
  it('VALID: {function with return spread contract.parse()} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'ReturnStatement',
            argument: TsestreeStub({
              type: 'ObjectExpression',
              properties: [
                TsestreeStub({
                  type: 'SpreadElement',
                  argument: TsestreeStub({
                    type: 'CallExpression',
                    callee: TsestreeStub({
                      type: 'MemberExpression',
                      object: TsestreeStub({
                        type: 'Identifier',
                        name: 'dataContract',
                      }),
                      property: TsestreeStub({
                        type: 'Identifier',
                        name: 'parse',
                      }),
                    }),
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Variable declaration with contract.parse()
  it('VALID: {function with variable declaration using contract.parse()} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'VariableDeclaration',
            declarations: [
              TsestreeStub({
                type: 'VariableDeclarator',
                init: TsestreeStub({
                  type: 'CallExpression',
                  callee: TsestreeStub({
                    type: 'MemberExpression',
                    object: TsestreeStub({
                      type: 'Identifier',
                      name: 'userContract',
                    }),
                    property: TsestreeStub({
                      type: 'Identifier',
                      name: 'parse',
                    }),
                  }),
                }),
              }),
            ],
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Multiple statements with contract.parse() in variable declaration
  it('VALID: {function with multiple statements including contract.parse()} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'ExpressionStatement',
          }),
          TsestreeStub({
            type: 'VariableDeclaration',
            declarations: [
              TsestreeStub({
                type: 'VariableDeclarator',
                init: TsestreeStub({
                  type: 'CallExpression',
                  callee: TsestreeStub({
                    type: 'MemberExpression',
                    object: TsestreeStub({
                      type: 'Identifier',
                      name: 'dataContract',
                    }),
                    property: TsestreeStub({
                      type: 'Identifier',
                      name: 'parse',
                    }),
                  }),
                }),
              }),
            ],
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Invalid cases
  it('INVALID: {arrow function without contract.parse()} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({
          type: 'Identifier',
          name: 'someFunction',
        }),
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {function with return non-contract.parse()} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'ReturnStatement',
            argument: TsestreeStub({
              type: 'ObjectExpression',
              properties: [],
            }),
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {function with variable declaration without contract.parse()} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'VariableDeclaration',
            declarations: [
              TsestreeStub({
                type: 'VariableDeclarator',
                init: TsestreeStub({
                  type: 'Literal',
                  value: 'test',
                }),
              }),
            ],
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {object expression without contract.parse() spread} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'ObjectExpression',
        properties: [
          TsestreeStub({
            type: 'Property',
            key: TsestreeStub({
              type: 'Identifier',
              name: 'foo',
            }),
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  // Empty cases
  it('EMPTY: {funcNode: undefined} => returns false', () => {
    expect(isAstFunctionUsesContractParseGuard({})).toBe(false);
  });

  it('EMPTY: {function with no body} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: undefined,
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {function with empty block statement} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {function with BlockStatement but no body array} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: undefined,
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {variable declaration with no init} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'VariableDeclaration',
            declarations: [
              TsestreeStub({
                type: 'VariableDeclarator',
                init: undefined,
              }),
            ],
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {return statement with no argument} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'ReturnStatement',
            argument: undefined,
          }),
        ],
      }),
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });
});
