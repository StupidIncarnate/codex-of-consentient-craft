import { validateProxyConstructorSideEffectsLayerBroker } from './validate-proxy-constructor-side-effects-layer-broker';
import { validateProxyConstructorSideEffectsLayerBrokerProxy } from './validate-proxy-constructor-side-effects-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('validateProxyConstructorSideEffectsLayerBroker', () => {
  describe('function with no body', () => {
    it('EMPTY: {body: undefined} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: undefined,
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with array body', () => {
    it('EDGE: {body: []} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: [] as unknown as typeof functionNode.body,
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with non-block statement body', () => {
    it('VALID: {body.type: ObjectExpression} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.ObjectExpression,
          properties: [],
        }),
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with block statement but no body.body', () => {
    it('EDGE: {body.type: BlockStatement, body.body: undefined} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: undefined,
        }),
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EDGE: {body.type: BlockStatement, body.body: not array} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with no return statement', () => {
    it('EDGE: {statements with no ReturnStatement} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('allowed operations before return', () => {
    it('VALID: {mock.mockImplementation()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {jest.spyOn()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {handle.calledWith([]).resolves()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'handle',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'calledWith',
                      }),
                    }),
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'resolves',
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {handle.onceFor([]).rejects()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'handle',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'onceFor',
                      }),
                    }),
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'rejects',
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {handle.calledWith([]).returns()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'handle',
                      }),
                      property: TsestreeStub({
                        type: TsestreeNodeType.Identifier,
                        name: 'calledWith',
                      }),
                    }),
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'returns',
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {bare handle.calledWith([])} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                    name: 'handle',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'calledWith',
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {bare handle.onceFor([])} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                    name: 'handle',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'onceFor',
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {bare handle.callsMatching([])} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                    name: 'handle',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'callsMatching',
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {childProxy.someMethod()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                    name: 'childProxy',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'someMethod',
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('disallowed side effects before return', () => {
    it('INVALID: {database.connect()} => reports proxyConstructorNoSideEffects with type database.connect()', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'database',
            }),
            property: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'connect',
            }),
          }),
        }),
      });

      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            statement,
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'proxyConstructorNoSideEffects',
        data: { type: 'database.connect()' },
      });
    });

    it('INVALID: {foo.query().returns()} => reports proxyConstructorNoSideEffects with type unknown.returns() since the chain does not bottom out in calledWith/onceFor', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({
              type: TsestreeNodeType.CallExpression,
              callee: TsestreeStub({
                type: TsestreeNodeType.MemberExpression,
                object: TsestreeStub({
                  type: TsestreeNodeType.Identifier,
                  name: 'foo',
                }),
                property: TsestreeStub({
                  type: TsestreeNodeType.Identifier,
                  name: 'query',
                }),
              }),
            }),
            property: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'returns',
            }),
          }),
        }),
      });

      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            statement,
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'proxyConstructorNoSideEffects',
        data: { type: 'unknown.returns()' },
      });
    });

    it('INVALID: {logger.log()} => reports proxyConstructorNoSideEffects with type logger.log()', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'logger',
            }),
            property: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'log',
            }),
          }),
        }),
      });

      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            statement,
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'proxyConstructorNoSideEffects',
        data: { type: 'logger.log()' },
      });
    });
  });

  describe('statements after return are ignored', () => {
    it('EDGE: {side effect after return} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'database',
                  }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'connect',
                  }),
                }),
              }),
            }),
          ],
        }),
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('edge cases with undefined or null nodes', () => {
    it('EDGE: {statement is null} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EDGE: {ExpressionStatement with no expression} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EDGE: {CallExpression with no callee} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
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
                callee: undefined,
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

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});
