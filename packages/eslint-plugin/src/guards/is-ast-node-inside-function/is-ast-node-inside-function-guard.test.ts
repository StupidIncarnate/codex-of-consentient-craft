import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstNodeInsideFunctionGuard } from './is-ast-node-inside-function-guard';

describe('isAstNodeInsideFunctionGuard', () => {
  it('VALID: {node with ArrowFunctionExpression parent} => returns true', () => {
    const node = IdentifierStub({ code: '(x) => {};' });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with FunctionExpression parent} => returns true', () => {
    const node = IdentifierStub({ code: '(function (x) {});' });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with FunctionDeclaration parent} => returns true', () => {
    const node = IdentifierStub({ code: 'function f(x) {}' });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with nested function ancestor} => returns true', () => {
    const node = IdentifierStub({ code: '() => { const x = 1; };' });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with non-function parents} => returns false', () => {
    const node = IdentifierStub({ code: 'x;' });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(false);
  });

  it('EMPTY: {node at the program root} => returns false', () => {
    const node = IdentifierStub({ code: 'x;' });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstNodeInsideFunctionGuard({ node: undefined })).toBe(false);
  });
});
