import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { isAstParamStubArgumentTypeGuard } from './is-ast-param-stub-argument-type-guard';

describe('isAstParamStubArgumentTypeGuard', () => {
  it('VALID: {funcNode with StubArgument<T> type on ObjectPattern} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({  }: StubArgument) => {};' });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode with StubArgument<T> type on AssignmentPattern} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = ({  }: StubArgument = 0) => {};',
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode with different type annotation} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({  }: OtherType) => {};' });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with non-TSTypeReference annotation} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({  }: string) => {};' });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode without type annotation} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({  }) => {};' });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode with no params} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstParamStubArgumentTypeGuard({})).toBe(false);
  });
});
