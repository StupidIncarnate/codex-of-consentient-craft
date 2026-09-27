import { checkAnyLeakReturnLayerBroker } from './check-any-leak-return-layer-broker';
import { checkAnyLeakReturnLayerBrokerProxy } from './check-any-leak-return-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

const jsonParseCall = () =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'JSON' }),
      property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parse' }),
    }),
  });

describe('checkAnyLeakReturnLayerBroker', () => {
  it('VALID: {return JSON.parse(text) directly, no declared return type} => reports anyLeakNoReturnType', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const functionNode = TsestreeStub({
      type: TsestreeNodeType.ArrowFunctionExpression,
      parent: null,
    });
    const returnStatement = TsestreeStub({
      type: TsestreeNodeType.ReturnStatement,
      argument: jsonParseCall(),
    });
    const blockNode = TsestreeStub({
      type: TsestreeNodeType.BlockStatement,
      parent: functionNode,
      body: [returnStatement],
    });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledWith({
      node: returnStatement,
      messageId: 'anyLeakNoReturnType',
    });
  });

  it('VALID: {const data = JSON.parse(text); return data;, no declared return type} => reports anyLeakNoReturnType', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const functionNode = TsestreeStub({
      type: TsestreeNodeType.ArrowFunctionExpression,
      parent: null,
    });
    const declarator = TsestreeStub({
      type: TsestreeNodeType.VariableDeclarator,
      id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'data' }),
      init: jsonParseCall(),
    });
    const variableDeclaration = TsestreeStub({
      type: TsestreeNodeType.VariableDeclaration,
      declarations: [declarator],
    });
    const returnStatement = TsestreeStub({
      type: TsestreeNodeType.ReturnStatement,
      argument: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'data' }),
    });
    const blockNode = TsestreeStub({
      type: TsestreeNodeType.BlockStatement,
      parent: functionNode,
      body: [variableDeclaration, returnStatement],
    });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledWith({
      node: returnStatement,
      messageId: 'anyLeakNoReturnType',
    });
  });

  it('EMPTY: {enclosing function declares a return type} => reports nothing', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const functionNode = TsestreeStub({
      type: TsestreeNodeType.ArrowFunctionExpression,
      parent: null,
      returnType: TsestreeStub({
        type: TsestreeNodeType.TSTypeAnnotation,
        typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSUnknownKeyword }),
      }),
    });
    const returnStatement = TsestreeStub({
      type: TsestreeNodeType.ReturnStatement,
      argument: jsonParseCall(),
    });
    const blockNode = TsestreeStub({
      type: TsestreeNodeType.BlockStatement,
      parent: functionNode,
      body: [returnStatement],
    });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledTimes(0);
  });

  it('EMPTY: {returned identifier traces to a non-JSON.parse/import initializer} => reports nothing', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const functionNode = TsestreeStub({
      type: TsestreeNodeType.ArrowFunctionExpression,
      parent: null,
    });
    const declarator = TsestreeStub({
      type: TsestreeNodeType.VariableDeclarator,
      id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'data' }),
      init: TsestreeStub({ type: TsestreeNodeType.Literal, value: 5 }),
    });
    const variableDeclaration = TsestreeStub({
      type: TsestreeNodeType.VariableDeclaration,
      declarations: [declarator],
    });
    const returnStatement = TsestreeStub({
      type: TsestreeNodeType.ReturnStatement,
      argument: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'data' }),
    });
    const blockNode = TsestreeStub({
      type: TsestreeNodeType.BlockStatement,
      parent: functionNode,
      body: [variableDeclaration, returnStatement],
    });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledTimes(0);
  });
});
