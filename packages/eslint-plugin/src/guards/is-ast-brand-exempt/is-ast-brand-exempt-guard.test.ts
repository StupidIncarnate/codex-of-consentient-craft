import { NewExpressionStub } from '#gateway/npm/typescript-eslint__utils/new-expression/new-expression.stub';
import { isAstBrandExemptGuard } from './is-ast-brand-exempt-guard';

// The node is a `new` expression because a stub finds the OUTERMOST node of a type first, and the
// `new` expression is the only one in each snippet.
describe('isAstBrandExemptGuard', () => {
  it('VALID: {node: z.record key} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.record(new S(), z.number());' });

    expect(isAstBrandExemptGuard({ node })).toBe(true);
  });

  it('VALID: {node: inside z.function} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.function({ input: [new S()] });' });

    expect(isAstBrandExemptGuard({ node })).toBe(true);
  });

  it('INVALID: {node: object field} => returns false', () => {
    const node = NewExpressionStub({ code: "z.object({ name: new S() }).brand<'Q'>();" });

    expect(isAstBrandExemptGuard({ node })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstBrandExemptGuard({})).toBe(false);
  });
});
