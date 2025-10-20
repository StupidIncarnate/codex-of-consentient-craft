import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstParamSpreadOperatorGuard } from './is-ast-param-spread-operator-guard';

describe('isAstParamSpreadOperatorGuard', () => {
  it('VALID: {funcNode with { ...props } as ObjectPattern} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
          properties: [
            TsestreeStub({
              type: 'RestElement',
            }),
          ],
        }),
      ],
    });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode with { ...props } in AssignmentPattern} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'AssignmentPattern',
          left: TsestreeStub({
            type: 'ObjectPattern',
            properties: [
              TsestreeStub({
                type: 'RestElement',
              }),
            ],
          }),
        }),
      ],
    });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode with Property instead of RestElement} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
          properties: [
            TsestreeStub({
              type: 'Property',
              key: TsestreeStub({
                type: 'Identifier',
                name: 'value',
              }),
            }),
          ],
        }),
      ],
    });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with multiple properties} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'ObjectPattern',
          properties: [
            TsestreeStub({
              type: 'RestElement',
            }),
            TsestreeStub({
              type: 'Property',
              key: TsestreeStub({
                type: 'Identifier',
                name: 'other',
              }),
            }),
          ],
        }),
      ],
    });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with non-ObjectPattern param} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'Identifier',
          name: 'props',
        }),
      ],
    });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode with no params} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [],
    });

    expect(isAstParamSpreadOperatorGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstParamSpreadOperatorGuard({})).toBe(false);
  });
});
