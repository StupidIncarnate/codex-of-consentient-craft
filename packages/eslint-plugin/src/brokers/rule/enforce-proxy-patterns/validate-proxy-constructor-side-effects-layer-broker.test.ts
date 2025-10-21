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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {body.type: BlockStatement, body.body: not array} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = {
        type: TsestreeNodeType.ArrowFunctionExpression,
        parent: null,
        body: {
          type: TsestreeNodeType.BlockStatement,
          parent: null,
          body: 'not-an-array',
        },
      } as unknown as ReturnType<typeof TsestreeStub>;

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('edge cases with undefined or null nodes', () => {
    it('EDGE: {statement is null} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = {
        type: TsestreeNodeType.ArrowFunctionExpression,
        parent: null,
        body: {
          type: TsestreeNodeType.BlockStatement,
          parent: null,
          body: [
            null,
            {
              type: TsestreeNodeType.ReturnStatement,
              parent: null,
              argument: {
                type: TsestreeNodeType.ObjectExpression,
                parent: null,
                properties: [],
              },
            },
          ],
        },
      } as unknown as ReturnType<typeof TsestreeStub>;

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
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

      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});
