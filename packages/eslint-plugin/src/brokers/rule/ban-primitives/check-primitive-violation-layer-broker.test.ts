import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { TSStringKeywordStub } from '#gateway/npm/typescript-eslint__utils/ts-string-keyword/ts-string-keyword.stub';
import { checkPrimitiveViolationLayerBrokerProxy } from './check-primitive-violation-layer-broker.proxy';

describe('checkPrimitiveViolationLayerBroker', () => {
  it('VALID: {allowPrimitiveInputs: true, node in parameter} => does not report', () => {
    const proxy = checkPrimitiveViolationLayerBrokerProxy();
    const mockReport = jest.fn();
    const ctx = RuleContextStub({ report: mockReport });

    // Simulate: function(param: string)

    const stringNode = TSStringKeywordStub({ code: 'function f(x: string) {}' });

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
    const ctx = RuleContextStub({ report: mockReport });

    const stringNode = TSStringKeywordStub({ code: 'function f(): string {}' });

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
    const ctx = RuleContextStub({ report: mockReport });

    // Simple node without complex parent chain
    const stringNode = TSStringKeywordStub({ code: 'let x: string;' });

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
    const ctx = RuleContextStub({ report: mockReport });

    const stringNode = TSStringKeywordStub({
      code: 'const f = ({ x }: { x: string } = {}) => {};',
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
    const ctx = RuleContextStub({ report: mockReport });

    const stringNode = TSStringKeywordStub({ code: 'const f = (x: string = "a") => {};' });

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
    const ctx = RuleContextStub({ report: mockReport });

    // Simulate: type User = { name: string }

    const stringNode = TSStringKeywordStub({ code: 'type T = { a: string };' });

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
