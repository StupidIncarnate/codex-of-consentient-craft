import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstParamStubArgumentTypeGuard } from './is-ast-param-stub-argument-type-guard';

describe('isAstParamStubArgumentTypeGuard', () => {
  it('VALID: {funcNode with StubArgument<T> type on ObjectPattern} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
          typeAnnotation: TsestreeStub({
            type: 'TSTypeAnnotation',
            typeAnnotation: TsestreeStub({
              type: 'TSTypeReference',
              typeName: TsestreeStub({
                type: 'Identifier',
                name: 'StubArgument',
              }),
            }),
          }),
        }),
      ],
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode with StubArgument<T> type on AssignmentPattern} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'AssignmentPattern',
          left: TsestreeStub({
            type: 'ObjectPattern',
            typeAnnotation: TsestreeStub({
              type: 'TSTypeAnnotation',
              typeAnnotation: TsestreeStub({
                type: 'TSTypeReference',
                typeName: TsestreeStub({
                  type: 'Identifier',
                  name: 'StubArgument',
                }),
              }),
            }),
          }),
        }),
      ],
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode with StubArgument<T> type directly on AssignmentPattern} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'AssignmentPattern',
          typeAnnotation: TsestreeStub({
            type: 'TSTypeAnnotation',
            typeAnnotation: TsestreeStub({
              type: 'TSTypeReference',
              typeName: TsestreeStub({
                type: 'Identifier',
                name: 'StubArgument',
              }),
            }),
          }),
        }),
      ],
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode with different type annotation} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
          typeAnnotation: TsestreeStub({
            type: 'TSTypeAnnotation',
            typeAnnotation: TsestreeStub({
              type: 'TSTypeReference',
              typeName: TsestreeStub({
                type: 'Identifier',
                name: 'OtherType',
              }),
            }),
          }),
        }),
      ],
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with non-TSTypeReference annotation} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
          typeAnnotation: TsestreeStub({
            type: 'TSTypeAnnotation',
            typeAnnotation: TsestreeStub({
              type: 'TSStringKeyword',
            }),
          }),
        }),
      ],
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode without type annotation} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
        }),
      ],
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode with no params} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [],
    });

    expect(isAstParamStubArgumentTypeGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstParamStubArgumentTypeGuard({})).toBe(false);
  });
});
