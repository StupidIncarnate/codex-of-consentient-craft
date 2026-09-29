import { NewExpressionStub } from '#gateway/npm/typescript-eslint__utils/new-expression/new-expression.stub';
import { isAstBrandInChainGuard } from './is-ast-brand-in-chain-guard';

// The chain starts from a `new` expression because a stub finds the OUTERMOST node of a type first,
// and a `new` expression is the one node type in a call chain that appears only at its innermost end.
describe('isAstBrandInChainGuard', () => {
  it('VALID: {node: receiver with .brand() in chain} => returns true', () => {
    const node = NewExpressionStub({ code: 'new S().brand();' });

    expect(isAstBrandInChainGuard({ node })).toBe(true);
  });

  it('VALID: {node: receiver.email() with .brand() in chain} => returns true', () => {
    const node = NewExpressionStub({ code: 'new S().email().brand();' });

    expect(isAstBrandInChainGuard({ node })).toBe(true);
  });

  it('VALID: {node: deeply nested with .brand() somewhere up chain} => returns true', () => {
    const node = NewExpressionStub({ code: 'new S().min(5).max(100).email().brand();' });

    expect(isAstBrandInChainGuard({ node })).toBe(true);
  });

  it('INVALID: {node: receiver without .brand()} => returns false', () => {
    const node = NewExpressionStub({ code: 'new S();' });

    expect(isAstBrandInChainGuard({ node })).toBe(false);
  });

  it('INVALID: {node: receiver.email() without .brand()} => returns false', () => {
    const node = NewExpressionStub({ code: 'new S().email();' });

    expect(isAstBrandInChainGuard({ node })).toBe(false);
  });

  it('INVALID: {node: chain with .optional() but not .brand()} => returns false', () => {
    const node = NewExpressionStub({ code: 'new S().optional();' });

    expect(isAstBrandInChainGuard({ node })).toBe(false);
  });

  it('INVALID: {node: parent with no property} => returns false', () => {
    const node = NewExpressionStub({ code: 'f(new S());' });

    expect(isAstBrandInChainGuard({ node })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstBrandInChainGuard({})).toBe(false);
  });
});
