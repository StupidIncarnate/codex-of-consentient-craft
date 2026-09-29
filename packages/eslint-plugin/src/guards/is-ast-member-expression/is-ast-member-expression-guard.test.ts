import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { isAstMemberExpressionGuard } from './is-ast-member-expression-guard';

describe('isAstMemberExpressionGuard', () => {
  it('VALID: {node: MemberExpression} => returns true', () => {
    const node = MemberExpressionStub({ code: 'obj.prop;' });

    expect(isAstMemberExpressionGuard({ node })).toBe(true);
  });

  it('VALID: {node: nested MemberExpression (obj.prop.nested)} => returns true', () => {
    const node = MemberExpressionStub({ code: 'obj.prop.nested;' });

    expect(isAstMemberExpressionGuard({ node })).toBe(true);
  });

  it('INVALID: {node: Identifier} => returns false', () => {
    const node = IdentifierStub({ code: 'foo;' });

    expect(isAstMemberExpressionGuard({ node })).toBe(false);
  });

  it('INVALID: {node: CallExpression} => returns false', () => {
    const node = CallExpressionStub({ code: 'foo();' });

    expect(isAstMemberExpressionGuard({ node })).toBe(false);
  });

  it('INVALID: {node: Literal} => returns false', () => {
    const node = LiteralStub({ code: 'const l = "test";' });

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
