import { validateFunctionParamsUseObjectDestructuringTransformer } from './validate-function-params-use-object-destructuring-transformer';
import { EslintContextStub } from '../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('validateFunctionParamsUseObjectDestructuringTransformer', () => {
  describe('function with no parameters', () => {
    it('EMPTY: {params: undefined} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: undefined,
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {params: []} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with object destructuring parameter', () => {
    it('VALID: {params: [ObjectPattern]} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {params: [AssignmentPattern with ObjectPattern]} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param = TsestreeStub({
        type: TsestreeNodeType.AssignmentPattern,
        left: TsestreeStub({
          type: TsestreeNodeType.ObjectPattern,
        }),
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with non-destructuring parameter', () => {
    it('INVALID: {params: [Identifier]} => reports useObjectDestructuring', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'user',
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    });

    it('INVALID: {params: [ArrayPattern]} => reports useObjectDestructuring', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param = TsestreeStub({
        type: TsestreeNodeType.ArrayPattern,
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    });

    it('INVALID: {params: [AssignmentPattern with Identifier]} => reports useObjectDestructuring', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param = TsestreeStub({
        type: TsestreeNodeType.AssignmentPattern,
        left: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'value',
        }),
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    });
  });

  describe('function with multiple parameters', () => {
    it('INVALID_MULTIPLE: {params: [Identifier, Identifier]} => reports for each parameter', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param1 = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'a',
      });
      const param2 = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'b',
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param1, param2],
      });

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

    it('VALID_MIXED: {params: [ObjectPattern, ObjectPattern]} => does not report', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param1 = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
      });
      const param2 = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param1, param2],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('INVALID_MIXED: {params: [ObjectPattern, Identifier]} => reports for non-destructured param only', () => {
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const param1 = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
      });
      const param2 = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'b',
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        params: [param1, param2],
      });

      validateFunctionParamsUseObjectDestructuringTransformer({ node, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: param2,
        messageId: 'useObjectDestructuring',
      });
    });
  });
});
