import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstMethodCallGuard } from './is-ast-method-call-guard';

describe('isAstMethodCallGuard', () => {
  it('VALID: {object: "jest", method: "spyOn", node: jest.spyOn()} => returns true', () => {
    const node = CallExpressionStub({ code: 'jest.spyOn();' });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(true);
  });

  it('VALID: {object: "console", method: "log", node: console.log()} => returns true', () => {
    const node = CallExpressionStub({ code: 'console.log();' });

    expect(isAstMethodCallGuard({ node, object: 'console', method: 'log' })).toBe(true);
  });

  it('INVALID: {object: "jest", method: "spyOn", node: foo.spyOn()} => returns false', () => {
    const node = CallExpressionStub({ code: 'foo.spyOn();' });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID: {object: "jest", method: "spyOn", node: jest.mock()} => returns false', () => {
    const node = CallExpressionStub({ code: 'jest.mock();' });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID: {node without callee} => returns false', () => {
    const node = IdentifierStub({ code: 'x;' });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID: {callee is not MemberExpression} => returns false', () => {
    const node = CallExpressionStub({ code: 'jest();' });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID: {callee.object is not Identifier} => returns false', () => {
    const node = CallExpressionStub({ code: '"jest".spyOn();' });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID: {callee.property is not Identifier} => returns false', () => {
    const node = CallExpressionStub({ code: 'jest["spyOn"]();' });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstMethodCallGuard({ object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {object omitted} => returns false', () => {
    const node = CallExpressionStub({ code: 'jest.spyOn();' });

    expect(isAstMethodCallGuard({ node, method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {method omitted} => returns false', () => {
    const node = CallExpressionStub({ code: 'jest.spyOn();' });

    expect(isAstMethodCallGuard({ node, object: 'jest' })).toBe(false);
  });
});
