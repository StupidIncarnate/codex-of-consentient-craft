import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstFunctionParamsDestructuredGuard } from './is-ast-function-params-destructured-guard';

describe('isAstFunctionParamsDestructuredGuard', () => {
  it('VALID: {funcNode: function with ObjectPattern param} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function with AssignmentPattern (ObjectPattern left)} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'AssignmentPattern',
          left: TsestreeStub({
            type: 'ObjectPattern',
          }),
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function with multiple ObjectPattern params} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
        }),
        TsestreeStub({
          type: 'ObjectPattern',
        }),
        TsestreeStub({
          type: 'AssignmentPattern',
          left: TsestreeStub({
            type: 'ObjectPattern',
          }),
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function with no params} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function with undefined params} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: undefined,
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(true);
  });

  it('INVALID_PARAM_TYPE: {funcNode: function with Identifier param} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'Identifier',
          name: 'x',
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID_PARAM_TYPE: {funcNode: function with ArrayPattern param} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ArrayPattern',
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID_MIXED: {funcNode: first param ObjectPattern, second Identifier} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
        }),
        TsestreeStub({
          type: 'Identifier',
          name: 'y',
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID_MIXED: {funcNode: first param Identifier, second ObjectPattern} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'Identifier',
          name: 'x',
        }),
        TsestreeStub({
          type: 'ObjectPattern',
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('INVALID_ASSIGNMENT: {funcNode: AssignmentPattern with Identifier left} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'AssignmentPattern',
          left: TsestreeStub({
            type: 'Identifier',
            name: 'x',
          }),
        }),
      ],
    });

    expect(isAstFunctionParamsDestructuredGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns true', () => {
    expect(isAstFunctionParamsDestructuredGuard({})).toBe(true);
  });
});
