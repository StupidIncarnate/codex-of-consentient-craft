import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { validateFunctionParamsUseObjectDestructuringTransformer } from './validate-function-params-use-object-destructuring-transformer';

describe('validateFunctionParamsUseObjectDestructuringTransformer', () => {
  describe('function with no parameters', () => {
    it('VALID: {params: []} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with object destructuring parameter', () => {
    it('VALID: {params: [ObjectPattern]} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = ({  }) => {};' });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {params: [AssignmentPattern with ObjectPattern]} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = ({  } = 0) => {};' });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with non-destructuring parameter', () => {
    it('INVALID: {params: [Identifier]} => reports useObjectDestructuring', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (user) => {};' });
      const [param] = node.params;

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    });

    it('INVALID: {params: [ArrayPattern]} => reports useObjectDestructuring', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = ([]) => {};' });
      const [param] = node.params;

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    });

    it('INVALID: {params: [AssignmentPattern with Identifier]} => reports useObjectDestructuring', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (value = 0) => {};' });
      const [param] = node.params;

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    });
  });

  describe('function with multiple parameters', () => {
    it('INVALID: {params: [Identifier, Identifier]} => reports for each parameter', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (a, b) => {};' });
      const [param1, param2] = node.params;

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node: param1,
        messageId: 'useObjectDestructuring',
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node: param2,
        messageId: 'useObjectDestructuring',
      });
    });

    it('VALID: {params: [ObjectPattern, ObjectPattern]} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = ({  }, {  }) => {};' });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('INVALID: {params: [ObjectPattern, Identifier]} => reports for non-destructured param only', () => {
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = ({  }, b) => {};' });
      const [, param2] = node.params;

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param2,
        messageId: 'useObjectDestructuring',
      });
    });
  });
});
