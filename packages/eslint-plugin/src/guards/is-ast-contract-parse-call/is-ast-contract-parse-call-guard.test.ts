import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstContractParseCallGuard } from './is-ast-contract-parse-call-guard';

describe('isAstContractParseCallGuard', () => {
  it('VALID: {CallExpression with contract.parse()} => returns true', () => {
    const node = CallExpressionStub({ code: 'userContract.parse();' });

    expect(isAstContractParseCallGuard({ node })).toBe(true);
  });

  it('VALID: {CallExpression with anyContract.parse()} => returns true', () => {
    const node = CallExpressionStub({ code: 'someOtherContract.parse();' });

    expect(isAstContractParseCallGuard({ node })).toBe(true);
  });

  it('INVALID: {CallExpression with non-contract.parse()} => returns false', () => {
    const node = CallExpressionStub({ code: 'someObject.parse();' });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('INVALID: {CallExpression with contract.validate()} => returns false', () => {
    const node = CallExpressionStub({ code: 'userContract.validate();' });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('INVALID: {CallExpression with non-MemberExpression callee} => returns false', () => {
    const node = CallExpressionStub({ code: 'someFunction();' });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('INVALID: {non-CallExpression node} => returns false', () => {
    const node = IdentifierStub({ code: 'test;' });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstContractParseCallGuard({})).toBe(false);
  });
});
