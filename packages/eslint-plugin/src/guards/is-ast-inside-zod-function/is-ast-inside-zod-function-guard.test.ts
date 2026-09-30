import { NewExpressionStub } from '#gateway/npm/typescript-eslint__utils/new-expression/new-expression.stub';
import { isAstInsideZodFunctionGuard } from './is-ast-inside-zod-function-guard';

// The node is a `new` expression because a stub finds the OUTERMOST node of a type first, and the
// `new` expression is the only one in each snippet.
describe('isAstInsideZodFunctionGuard', () => {
  it('VALID: {node: in z.function input} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.function({ input: [new S()], output: z.void() });' });

    expect(isAstInsideZodFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node: in z.function output, inside an object field} => returns true', () => {
    const node = NewExpressionStub({
      code: "z.object({ handler: z.function({ output: new S() }) }).brand<'Q'>();",
    });

    expect(isAstInsideZodFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node: in a call chained onto z.function} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.function().args(new S());' });

    expect(isAstInsideZodFunctionGuard({ node })).toBe(true);
  });

  it('INVALID: {node: object field beside a function field} => returns false', () => {
    const node = NewExpressionStub({
      code: "z.object({ handler: z.function(), name: new S() }).brand<'Q'>();",
    });

    expect(isAstInsideZodFunctionGuard({ node })).toBe(false);
  });

  it('INVALID: {node: in a call on another object} => returns false', () => {
    const node = NewExpressionStub({ code: 'y.function(new S());' });

    expect(isAstInsideZodFunctionGuard({ node })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstInsideZodFunctionGuard({})).toBe(false);
  });
});
