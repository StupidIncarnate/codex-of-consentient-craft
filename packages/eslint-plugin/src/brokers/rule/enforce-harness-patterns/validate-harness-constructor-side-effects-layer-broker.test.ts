import { validateHarnessConstructorSideEffectsLayerBroker } from './validate-harness-constructor-side-effects-layer-broker';
import { validateHarnessConstructorSideEffectsLayerBrokerProxy } from './validate-harness-constructor-side-effects-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('validateHarnessConstructorSideEffectsLayerBroker', () => {
  describe('function with no body', () => {
    it('EMPTY: {body: undefined} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: undefined,
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with array body', () => {
    it('EDGE: {body: []} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: [] as unknown as typeof functionNode.body,
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with block statement but no body.body', () => {
    it('EDGE: {body.type: BlockStatement, body.body: undefined} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: undefined,
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {body.type: BlockStatement, body.body: not array} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with non-block statement body', () => {
    it('VALID: {body.type: ObjectExpression} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.ObjectExpression,
          properties: [],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with no return statement', () => {
    it('EDGE: {statements with no ReturnStatement} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('allowed member expression operations', () => {
    it('VALID: {jest.spyOn()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                  object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'jest' }),
                  property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'spyOn' }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {mock.mockImplementation()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                  object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'mock' }),
                  property: TsestreeStub({
                    type: TsestreeNodeType.Identifier,
                    name: 'mockImplementation',
                  }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {childHarness.someMethod()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                  object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'childHarness' }),
                  property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'setup' }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {fs.mkdirSync()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                  object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'fs' }),
                  property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'mkdirSync' }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {os.tmpdir()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                  object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'os' }),
                  property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'tmpdir' }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {path.join()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                  object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'path' }),
                  property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'join' }),
                }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('allowed bare identifier calls', () => {
    it('VALID: {beforeEach(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'beforeEach' }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {afterEach(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'afterEach' }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {beforeAll(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'beforeAll' }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {afterAll(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'afterAll' }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {childHarness()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'childHarness' }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('disallowed side effects', () => {
    it('INVALID: {database.connect()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'database' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'connect' }),
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
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'database.connect()' },
      });
    });

    it('INVALID: {someRandomFunction()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someRandomFunction' }),
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
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'someRandomFunction()' },
      });
    });
  });

  describe('edge cases with undefined or null nodes', () => {
    it('EDGE: {statement is null} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {ExpressionStatement with no expression} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {CallExpression with no callee} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {Identifier callee with undefined name} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
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
                callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: undefined }),
              }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {MemberExpression with undefined property name} => reports with fallback method name', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'database' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: undefined }),
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
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'database.method()' },
      });
    });
  });

  describe('IIFE patterns', () => {
    it('INVALID: {(() => { doSomething() })()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.ArrowFunctionExpression,
            body: TsestreeStub({ type: TsestreeNodeType.BlockStatement, body: [] }),
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
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'IIFE' },
      });
    });

    it('INVALID: {(function() { doSomething() })()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.FunctionExpression,
            body: TsestreeStub({ type: TsestreeNodeType.BlockStatement, body: [] }),
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
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'IIFE' },
      });
    });
  });

  describe('assignment expression patterns', () => {
    it('INVALID: {process.env.FOO = bar} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
        expression: TsestreeStub({
          type: TsestreeNodeType.AssignmentExpression,
          left: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'process' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'env' }),
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
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'assignment expression' },
      });
    });
  });

  describe('variable declaration patterns', () => {
    it('INVALID: {const x = database.connect()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const statement = TsestreeStub({
        type: TsestreeNodeType.VariableDeclaration,
        kind: 'const',
        declarations: [
          TsestreeStub({
            type: TsestreeNodeType.VariableDeclarator,
            id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'x' }),
            init: TsestreeStub({
              type: TsestreeNodeType.CallExpression,
              callee: TsestreeStub({
                type: TsestreeNodeType.MemberExpression,
                object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'database' }),
                property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'connect' }),
              }),
            }),
          }),
        ],
      });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            statement,
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'database.connect()' },
      });
    });

    it('VALID: {const counters = new Map()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              kind: 'const',
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'counters' }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.NewExpression,
                    callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'Map' }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {const dir = path.join(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              kind: 'const',
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'dir' }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.CallExpression,
                    callee: TsestreeStub({
                      type: TsestreeNodeType.MemberExpression,
                      object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'path' }),
                      property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'join' }),
                    }),
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {let x = 0} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclaration,
              kind: 'let',
              declarations: [
                TsestreeStub({
                  type: TsestreeNodeType.VariableDeclarator,
                  id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'x' }),
                  init: TsestreeStub({
                    type: TsestreeNodeType.Literal,
                    value: 0,
                  }),
                }),
              ],
            }),
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('statements after return are ignored', () => {
    it('EDGE: {side effect after return} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({ type: TsestreeNodeType.ObjectExpression, properties: [] }),
            }),
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.CallExpression,
                callee: TsestreeStub({
                  type: TsestreeNodeType.MemberExpression,
                  object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'database' }),
                  property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'connect' }),
                }),
              }),
            }),
          ],
        }),
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});
