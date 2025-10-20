import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstParamSingleValuePropertyGuard } from './is-ast-param-single-value-property-guard';

describe('isAstParamSingleValuePropertyGuard', () => {
  it('VALID: {funcNode with { value } as ObjectPattern} => returns true', () => {
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

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode with { value } in AssignmentPattern} => returns true', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'AssignmentPattern',
          left: TsestreeStub({
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
        }),
      ],
    });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(true);
  });

  it('INVALID: {funcNode with { other } property} => returns false', () => {
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
                name: 'other',
              }),
            }),
          ],
        }),
      ],
    });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with multiple properties} => returns false', () => {
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

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {funcNode with non-ObjectPattern param} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [
        TsestreeStub({
          type: 'Identifier',
          name: 'value',
        }),
      ],
    });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode with no params} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      params: [],
    });

    expect(isAstParamSingleValuePropertyGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstParamSingleValuePropertyGuard({})).toBe(false);
  });
});
