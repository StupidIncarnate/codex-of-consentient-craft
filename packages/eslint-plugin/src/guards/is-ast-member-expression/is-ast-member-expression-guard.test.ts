import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstMemberExpressionGuard } from './is-ast-member-expression-guard';

describe('isAstMemberExpressionGuard', () => {
  it('VALID: {node: MemberExpression} => returns true', () => {
    const node = TsestreeStub({
      type: 'MemberExpression',
      object: TsestreeStub({
        type: 'Identifier',
        name: 'obj',
      }),
      property: TsestreeStub({
        type: 'Identifier',
        name: 'prop',
      }),
    });

    expect(isAstMemberExpressionGuard({ node })).toBe(true);
  });

  it('VALID: {node: nested MemberExpression (obj.prop.nested)} => returns true', () => {
    const node = TsestreeStub({
      type: 'MemberExpression',
      object: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'obj',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'prop',
        }),
      }),
      property: TsestreeStub({
        type: 'Identifier',
        name: 'nested',
      }),
    });

    expect(isAstMemberExpressionGuard({ node })).toBe(true);
  });

  it('INVALID_TYPE: {node: Identifier} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      name: 'foo',
    });

    expect(isAstMemberExpressionGuard({ node })).toBe(false);
  });

  it('INVALID_TYPE: {node: CallExpression} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'Identifier',
        name: 'foo',
      }),
    });

    expect(isAstMemberExpressionGuard({ node })).toBe(false);
  });

  it('INVALID_TYPE: {node: Literal} => returns false', () => {
    const node = TsestreeStub({
      type: 'Literal',
      value: 'test',
    });

    expect(isAstMemberExpressionGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: null} => returns false', () => {
    expect(isAstMemberExpressionGuard({ node: null })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstMemberExpressionGuard({ node: undefined })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstMemberExpressionGuard({})).toBe(false);
  });
});
