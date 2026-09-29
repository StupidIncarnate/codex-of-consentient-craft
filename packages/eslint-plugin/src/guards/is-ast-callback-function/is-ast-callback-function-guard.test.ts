import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { FunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/function-expression/function-expression.stub';
import { isAstCallbackFunctionGuard } from './is-ast-callback-function-guard';

describe('isAstCallbackFunctionGuard', () => {
  it('VALID: {funcNode: arrow function inside CallExpression} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: '(() => {})();' });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function expression inside CallExpression} => returns true', () => {
    const funcNode = FunctionExpressionStub({ code: '(function () {})();' });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode: arrow function inside ExpressionStatement} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: '() => {};' });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode: function inside VariableDeclarator} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const x = () => {};' });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode: function inside ExportDefaultDeclaration} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'export default () => {};' });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstCallbackFunctionGuard({})).toBe(false);
  });

  it('EMPTY: {funcNode with undefined parent} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });
});
