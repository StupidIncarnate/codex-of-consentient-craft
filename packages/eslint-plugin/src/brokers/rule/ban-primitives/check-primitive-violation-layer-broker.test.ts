import { checkPrimitiveViolationLayerBrokerProxy } from './check-primitive-violation-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub } from '../../../contracts/tsestree/tsestree.stub';

describe('checkPrimitiveViolationLayerBroker', () => {
  it('VALID: {allowPrimitiveInputs: true, node in parameter} => does not report', () => {
    const proxy = checkPrimitiveViolationLayerBrokerProxy();
    const mockReport = jest.fn();
    const ctx = EslintContextStub({ report: mockReport });

    // Simulate: function(param: string)
    const functionNode = TsestreeStub({
      type: 'FunctionDeclaration',
      params: [],
    });

    const identifierNode = TsestreeStub({
      type: 'Identifier',
      parent: functionNode,
    });

    const annotationNode = TsestreeStub({
      type: 'TSTypeAnnotation',
      parent: identifierNode,
    });

    const stringNode = TsestreeStub({
      type: 'TSStringKeyword',
      parent: annotationNode,
    });

    proxy.checkPrimitiveViolationLayerBroker({
      node: stringNode,
      typeName: 'string',
      suggestion: 'BrandedString',
      allowPrimitiveInputs: true,
      allowPrimitiveReturns: false,
      ctx,
    });

    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('INVALID: {allowPrimitiveInputs: true, node in return type} => reports error', () => {
    const proxy = checkPrimitiveViolationLayerBrokerProxy();
    const mockReport = jest.fn();
    const ctx = EslintContextStub({ report: mockReport });

    // Simulate: function(): string
    // Create nodes in reverse order to properly link returnType
    const annotationNode = TsestreeStub({
      type: 'TSTypeAnnotation',
      parent: null, // Will be set below
    });

    const functionNode = TsestreeStub({
      type: 'FunctionDeclaration',
      returnType: annotationNode,
    });

    // Link annotation back to function
    annotationNode.parent = functionNode;

    const stringNode = TsestreeStub({
      type: 'TSStringKeyword',
      parent: annotationNode,
    });

    proxy.checkPrimitiveViolationLayerBroker({
      node: stringNode,
      typeName: 'string',
      suggestion: 'BrandedString',
      allowPrimitiveInputs: true,
      allowPrimitiveReturns: false,
      ctx,
    });

    expect(mockReport).toHaveBeenCalledWith({
      node: stringNode,
      messageId: 'banPrimitive',
      data: {
        typeName: 'string',
        suggestion: 'BrandedString',
      },
    });
  });

  it('VALID: {allowPrimitiveReturns: true} => configuration is respected', () => {
    const proxy = checkPrimitiveViolationLayerBrokerProxy();
    const mockReport = jest.fn();
    const ctx = EslintContextStub({ report: mockReport });

    // Simple node without complex parent chain
    const stringNode = TsestreeStub({
      type: 'TSStringKeyword',
    });

    // Call the function with allowPrimitiveReturns=true
    proxy.checkPrimitiveViolationLayerBroker({
      node: stringNode,
      typeName: 'string',
      suggestion: 'BrandedString',
      allowPrimitiveInputs: false,
      allowPrimitiveReturns: true,
      ctx,
    });

    // With no parent chain, the node is not in a return type, so it reports
    expect(mockReport).toHaveBeenCalledWith({
      node: stringNode,
      messageId: 'banPrimitive',
      data: {
        typeName: 'string',
        suggestion: 'BrandedString',
      },
    });
  });

  it('VALID: {allowPrimitiveInputs: true, node in destructured parameter with a default value} => does not report', () => {
    // Regression: `({ x }: { x: string } = {}) => {}` wraps the ObjectPattern in an
    // AssignmentPattern (the default value), so `.params` lives one level above the
    // ObjectPattern's own parent rather than on it directly.
    const proxy = checkPrimitiveViolationLayerBrokerProxy();
    const mockReport = jest.fn();
    const ctx = EslintContextStub({ report: mockReport });

    const assignmentPatternNode = TsestreeStub({
      type: 'AssignmentPattern',
      parent: null,
    });

    const functionNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [assignmentPatternNode],
    });

    assignmentPatternNode.parent = functionNode;

    const objectPatternNode = TsestreeStub({
      type: 'ObjectPattern',
      parent: assignmentPatternNode,
    });

    const annotationNode = TsestreeStub({
      type: 'TSTypeAnnotation',
      parent: objectPatternNode,
    });

    const stringNode = TsestreeStub({
      type: 'TSStringKeyword',
      parent: annotationNode,
    });

    proxy.checkPrimitiveViolationLayerBroker({
      node: stringNode,
      typeName: 'string',
      suggestion: 'BrandedString',
      allowPrimitiveInputs: true,
      allowPrimitiveReturns: false,
      ctx,
    });

    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('VALID: {allowPrimitiveInputs: true, node in direct parameter with a default value} => does not report', () => {
    // Regression: `(x: string = "a") => {}` wraps the Identifier in an AssignmentPattern
    // the same way the destructured case does.
    const proxy = checkPrimitiveViolationLayerBrokerProxy();
    const mockReport = jest.fn();
    const ctx = EslintContextStub({ report: mockReport });

    const assignmentPatternNode = TsestreeStub({
      type: 'AssignmentPattern',
      parent: null,
    });

    const functionNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [assignmentPatternNode],
    });

    assignmentPatternNode.parent = functionNode;

    const identifierNode = TsestreeStub({
      type: 'Identifier',
      parent: assignmentPatternNode,
    });

    const annotationNode = TsestreeStub({
      type: 'TSTypeAnnotation',
      parent: identifierNode,
    });

    const stringNode = TsestreeStub({
      type: 'TSStringKeyword',
      parent: annotationNode,
    });

    proxy.checkPrimitiveViolationLayerBroker({
      node: stringNode,
      typeName: 'string',
      suggestion: 'BrandedString',
      allowPrimitiveInputs: true,
      allowPrimitiveReturns: false,
      ctx,
    });

    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('INVALID: {allowPrimitiveInputs: true, node in type property} => reports error', () => {
    const proxy = checkPrimitiveViolationLayerBrokerProxy();
    const mockReport = jest.fn();
    const ctx = EslintContextStub({ report: mockReport });

    // Simulate: type User = { name: string }
    const propertyNode = TsestreeStub({
      type: 'TSPropertySignature',
    });

    const annotationNode = TsestreeStub({
      type: 'TSTypeAnnotation',
      parent: propertyNode,
    });

    const stringNode = TsestreeStub({
      type: 'TSStringKeyword',
      parent: annotationNode,
    });

    proxy.checkPrimitiveViolationLayerBroker({
      node: stringNode,
      typeName: 'string',
      suggestion: 'BrandedString',
      allowPrimitiveInputs: true,
      allowPrimitiveReturns: false,
      ctx,
    });

    expect(mockReport).toHaveBeenCalledWith({
      node: stringNode,
      messageId: 'banPrimitive',
      data: {
        typeName: 'string',
        suggestion: 'BrandedString',
      },
    });
  });
});
