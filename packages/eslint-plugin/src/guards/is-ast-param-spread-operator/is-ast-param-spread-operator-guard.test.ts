import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { isAstParamSpreadOperatorGuard } from './is-ast-param-spread-operator-guard';

describe('isAstParamSpreadOperatorGuard', () => {
  it('VALID: {funcNode with { ...props } as ObjectPattern} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({ ...x }) => {};' });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode with { ...props } in AssignmentPattern} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({ ...x } = 0) => {};' });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode with Property instead of RestElement} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({ value: v }) => {};' });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with multiple properties} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({ ...x, other: v }) => {};' });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with non-ObjectPattern param} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = (props) => {};' });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode with no params} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstParamSpreadOperatorGuard({})).toBe(false);
  });
});
