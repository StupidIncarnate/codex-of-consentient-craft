import { ObjectExpressionStub } from '#gateway/npm/typescript-eslint__utils/object-expression/object-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstObjectStubSpreadGuard } from './is-ast-object-stub-spread-guard';

describe('isAstObjectStubSpreadGuard', () => {
  it('VALID: {ObjectExpression with only ...WalkFactsStub()} => returns true', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...WalkFactsStub() };' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(true);
  });

  it('VALID: {ObjectExpression with two stub spreads} => returns true', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...UserStub(), ...AddressStub() };' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(true);
  });

  it('INVALID: {ObjectExpression with stub spread plus a hand-written property} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...UserStub(), name: v };' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression spreading a non-stub call} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...buildUser() };' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression spreading a variable} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...baseUser };' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression spreading a member call} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...stubs.UserStub() };' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {non-ObjectExpression node} => returns false', () => {
    const node = IdentifierStub({ code: 'test;' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstObjectStubSpreadGuard({})).toBe(false);
  });

  it('EMPTY: {ObjectExpression with no properties} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = {  };' });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });
});
