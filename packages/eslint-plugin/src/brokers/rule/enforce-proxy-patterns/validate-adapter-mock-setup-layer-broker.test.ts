import { validateAdapterMockSetupLayerBroker } from './validate-adapter-mock-setup-layer-broker';
import { validateAdapterMockSetupLayerBrokerProxy } from './validate-adapter-mock-setup-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('validateAdapterMockSetupLayerBroker', () => {
  describe('function with no body', () => {
    it('EMPTY: {body: undefined} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: undefined,
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with array body', () => {
    it('EDGE: {body: []} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: [] as unknown as typeof functionNode.body,
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with non-block statement body', () => {
    it('VALID: {body.type: ObjectExpression} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.ObjectExpression,
          properties: [],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with block statement but no body.body', () => {
    it('EDGE: {body.type: BlockStatement, body.body: undefined} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: undefined,
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {body.type: BlockStatement, body.body: not array} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [],
        }),
      });
      // Inject invalid data after all stubs created to test edge case
      const bodyRef = functionNode.body as never as Record<PropertyKey, never>;
      bodyRef.body = 'not-an-array' as never;

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with no return statement', () => {
    it('EDGE: {statements with no ReturnStatement} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.Literal,
                value: 'hello',
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with jest mocking and mock setup', () => {
    it('VALID: {jest.mocked() + mockImplementation()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'mocked',
                      }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mock',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mockImplementation',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {jest.spyOn() + mockResolvedValue()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'spyOn',
                      }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mock',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mockResolvedValue',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {jest.spyOn() in ExpressionStatement + mockRejectedValue()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'jest',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'spyOn',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mock',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mockRejectedValue',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {jest.mocked() + mockReturnValue()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'mocked',
                      }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mock',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mockReturnValue',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {jest.mocked() + mockReturnValueOnce()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'mocked',
                      }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mock',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mockReturnValueOnce',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {jest.mocked() + mockResolvedValueOnce()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'mocked',
                      }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mock',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mockResolvedValueOnce',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with jest mocking but no mock setup', () => {
    it('INVALID: {jest.mocked() without mock setup} => reports adapterProxyMustSetupMocks', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'mocked',
                      }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'adapterProxyMustSetupMocks',
      });
    });

    it('INVALID: {jest.spyOn() without mock setup} => reports adapterProxyMustSetupMocks', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'spyOn',
                      }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'adapterProxyMustSetupMocks',
      });
    });
  });

  describe('function with no jest mocking', () => {
    it('VALID: {no jest mocking} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.Literal,
                    value: 'test',
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('statements after return are ignored', () => {
    it('EDGE: {jest.mocked() after return} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'jest',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'mocked',
                      }),
                    }),
                  }),
                }),
              ],
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('edge cases with undefined or null nodes', () => {
    it('EDGE: {statement is null} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const returnStatement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.ObjectExpression,
          properties: [],
        }),
      });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [],
        }),
      });
      // Inject invalid data after all stubs created to test edge case
      const bodyRef = functionNode.body as never as Record<PropertyKey, never>;
      bodyRef.body = [null, returnStatement] as never;

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {ExpressionStatement with no expression} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: undefined,
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {VariableDeclaration with no declarations} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              declarations: undefined,
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});
