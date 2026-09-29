import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { isAstFunctionParamsDestructuredGuard } from './is-ast-function-params-destructured-guard';

describe('isAstFunctionParamsDestructuredGuard', () => {
  it('VALID: {funcNode: function with ObjectPattern param} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({  }) => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function with AssignmentPattern (ObjectPattern left)} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({  } = 0) => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function with multiple ObjectPattern params} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = ({  }, {  }, {  } = 0) => {};',
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function with no params} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode: function with Identifier param} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = (x) => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode: function with ArrayPattern param} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ([]) => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode: first param ObjectPattern, second Identifier} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = ({  }, y) => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode: first param Identifier, second ObjectPattern} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = (x, {  }) => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode: AssignmentPattern with Identifier left} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = (x = 0) => {};' });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns true', () => {
    expect(isAstFunctionParamsDestructuredGuard({})).toBe(true);
  });
});
