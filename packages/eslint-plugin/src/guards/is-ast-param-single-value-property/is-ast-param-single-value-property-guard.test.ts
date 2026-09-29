import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { isAstParamSingleValuePropertyGuard } from './is-ast-param-single-value-property-guard';

describe('isAstParamSingleValuePropertyGuard', () => {
  it('VALID: {funcNode with { value } as ObjectPattern} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({ value: v }) => {};' });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode with { value } in AssignmentPattern} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({ value: v } = 0) => {};' });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode with { other } property} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({ other: v }) => {};' });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with multiple properties} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = ({ value: v, other: v }) => {};',
    });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with non-ObjectPattern param} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = (value) => {};' });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode with no params} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstParamSingleValuePropertyGuard({})).toBe(false);
  });
});
